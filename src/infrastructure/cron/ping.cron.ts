import cron from "node-cron";
import axios from "axios";

export const startPingCron = () => {
  cron.schedule("*/14 * * * *", async () => {
    try {
      await axios.get(process.env.CLIENT + "/health");
      console.log("⏰ App is OK");
    } catch (error) {
      console.error("❌ App is not OK ", error);
    }
  });
};
