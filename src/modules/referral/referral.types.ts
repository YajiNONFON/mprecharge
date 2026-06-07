import { PointTxType, ReferralStatus } from "../../../generated/prisma/enums";

// REFERRAL
export interface ReferralItem {
  id: string;
  referrerId: string;
  referredId: string;
  referredName: string;
  status: ReferralStatus;
  createdAt: Date;
  validatedAt: Date | null;
}
export interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
}

// POINTS

export interface PointTransactionItem {
  id: string;
  type: PointTxType; // EARN | WELCOME | CONVERT
  points: number;
  referredName: string | null;
  transactionAmount: number | null;
  createdAt: Date;
}

// STATS PARRAIN

export interface ReferralStats {
  referralCode: string | null;
  pointsBalance: number;
  totalPointsEarned: number;
  totalFilleuls: number;
  validatedFilleuls: number;
  pendingFilleuls: number;
  totalTransactionVolume: number;
  isEligibleForPayout: boolean;
  estimatedPayout: number;
  pagination: PaginationMeta;
  referrals: ReferralItem[];
  pointHistory: PointTransactionItem[];
}

// PAYOUT

export interface PayoutItem {
  id: string;
  userId: string;
  userName: string;
  pointsConverted: number;
  amountPaid: number;
  paidAt: Date;
}

// CONVERSION RATE

export interface ConversionRate {
  rate: number; // 1 point = X FCFA
  updatedAt: Date;
}

// ADMIN STATS

export interface AdminReferralStats {
  totalReferrals: number;
  validatedReferrals: number;
  pendingReferrals: number;
  totalPointsDistributed: number;
  totalPayouts: number;
  totalAmountPaid: number;
  pagination: PaginationMeta;
  referrals: ReferralItem[];
}
