import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Fallback placeholder color when the API doesn't supply one
const CATEGORY_COLORS = {
  Food:      '#FFF9C4',
  Shopping:  '#F3E5F5',
  Services:  '#E3F2FD',
  Utilities: '#FFF3E0',
  default:   '#E8F5E9',
};

function placeholderBg(reward) {
  if (reward.placeholderColor && typeof reward.placeholderColor === 'string') {
    return reward.placeholderColor;
  }
  return CATEGORY_COLORS[reward.category] ?? CATEGORY_COLORS.default;
}

/**
 * RewardCard
 *
 * Props:
 *   reward      — normalized reward object from fetchRewards()
 *   onRedeem    — called with reward.id when "Redeem" is tapped
 *   isPending   — true when the resident has an unclaimed pending redemption
 *                 for this reward; shows an amber "Ongoing" button instead
 *   onViewQR    — called with the pending redemptionId when "Ongoing" is tapped
 *   redemptionId — the pending redemption ID (needed for onViewQR)
 */
export default function RewardCard({ reward, onRedeem, isPending = false, onViewQR, redemptionId }) {
  return (
    <View style={styles.card}>
      <View style={[styles.imagePlaceholder, { backgroundColor: placeholderBg(reward) }]}>
        <Text style={styles.partnerInitial}>{reward.partner?.[0] ?? '?'}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>{reward.name}</Text>
        <View style={styles.costRow}>
          <Ionicons name="diamond" size={12} color={colors.primary} />
          <Text style={styles.cost}>{reward.tokenCost.toLocaleString()} ECO</Text>
        </View>

        {isPending ? (
          <TouchableOpacity
            style={styles.ongoingBtn}
            onPress={() => onViewQR?.(redemptionId)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={12} color={colors.warning} />
            <Text style={styles.ongoingText}>Ongoing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.redeemBtn}
            onPress={() => onRedeem(reward.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.redeemText}>Redeem</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePlaceholder: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInitial: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    opacity: 0.3,
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  name: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cost: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
  redeemBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  redeemText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  ongoingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 2,
    backgroundColor: colors.warningLight,
  },
  ongoingText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    fontWeight: typography.weight.semibold,
  },
});
