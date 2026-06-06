import { Role } from "../../../generated/prisma/enums";

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  referralCode: string | null;
  pointsBalance: number;
  profileImage: string | null;
  activeServiceId: string | null;
  platformAccountId: string | null;
  oneXbetId: string | null;
  mtnNumber: string | null;
  moovNumber: string | null;
  celtiisNumber: string | null;
  orangeNumber: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralSummary {
  totalReferrals: number;
  validatedReferrals: number;
  pendingReferrals: number;
  pointsBalance: number;
  referrals: ReferralItem[];
}

export interface ReferralItem {
  id: string;
  referredName: string;
  status: string;
  createdAt: Date;
  validatedAt: Date | null;
}
