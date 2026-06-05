import { Service } from "../../../generated/prisma/client";

export interface ProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profileImage: string | null;
  activeServiceId?: string;
  activeService: Service;
  platformAccountId?: string;
  phone: string;
  oneXbetId: string | null;
  oneWinId: string | null;
  mtnNumber: string | null;
  moovNumber: string | null;
  celtiisNumber: string | null;
  orangeNumber: string | null;
  created_at: Date;
  updated_at: Date;
}
