import {
  getStartDate,
  fetchAdminStats,
  fetchChartData,
  fetchPeakHours,
} from "./admin.repository";

export const getAdminStats = async (
  period: "day" | "week" | "month" | "year" = "day",
) => {
  const startDate = getStartDate(period);
  return fetchAdminStats(startDate);
};

// NOUVEAU — chart data
export const getChartData = async (
  period: "day" | "week" | "month" | "year" = "week",
) => {
  return fetchChartData(period);
};

// NOUVEAU — peak hours
export const getPeakHours = async () => {
  return fetchPeakHours();
};
