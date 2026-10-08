// services/rekognition.js
// Two-step flow to avoid multipart/timeout issues on mobile:
//   1. GET  /get-upload-url  → presigned S3 PUT URL + s3_key
//   2. PUT  image → S3 directly (no middleman, fast)
//   3. POST /analyze-s3      → { s3_key } → { verdict, s3_key }

const REKOGNITION_URL = process.env.EXPO_PUBLIC_REKOGNITION_API_URL; // no trailing slash

/**
 * Analyze a bin photo via the FastAPI Analyzer.
 *
 * @param {string} uri - Local file URI from expo-camera
 * @returns {Promise<{ verdict: 'full' | 'not full', s3_key: string }>}
 * @throws {Error} with a user-facing message on any failure
 */
export async function analyzePhoto(uri) {
  // ── Step 1: get presigned upload URL ──────────────────────────────────────
  let uploadUrl, s3Key;
  try {
    const res  = await _fetchWithTimeout(`${REKOGNITION_URL}/get-upload-url`, { method: 'GET' }, 15_000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not prepare upload.');
    uploadUrl = data.upload_url;
    s3Key     = data.s3_key;
  } catch (err) {
    throw _classifyError(err);
  }

  // ── Step 2: upload image directly to S3 via presigned URL ─────────────────
  try {
    // Read the file as a blob
    const fileRes  = await fetch(uri);
    const blob     = await fileRes.blob();

    const putRes = await _fetchWithTimeout(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body:    blob,
    }, 30_000); // S3 upload can take longer

    if (!putRes.ok) {
      throw new Error(`S3 upload failed (${putRes.status}).`);
    }
  } catch (err) {
    throw _classifyError(err);
  }

  // ── Step 3: ask Analyzer to classify the uploaded image ───────────────────
  try {
    const res  = await _fetchWithTimeout(
      `${REKOGNITION_URL}/analyze-s3`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ s3_key: s3Key }),
      },
      20_000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Analyzer error (${res.status}).`);
    return data; // { verdict, s3_key }
  } catch (err) {
    throw _classifyError(err);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function _classifyError(err) {
  if (!err) return new Error('An unknown error occurred.');
  if (err.name === 'AbortError') {
    return new Error('Request timed out. Please try again.');
  }
  const msg = err.message || '';
  if (
    msg.includes('Network request failed') ||
    msg.includes('Failed to fetch')        ||
    msg.includes('Network error')          ||
    msg.includes('fetch')
  ) {
    return new Error('Network error. Please check your connection.');
  }
  return err;
}
