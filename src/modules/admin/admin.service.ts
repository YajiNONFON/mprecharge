import { getStartDate, fetchAdminStats } from "./admin.repository";

export const getAdminStats = async (
  period: "day" | "week" | "month" | "year" = "day",
) => {
  const startDate = getStartDate(period);
  return fetchAdminStats(startDate);
};
