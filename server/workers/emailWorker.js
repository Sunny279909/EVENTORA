const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { sendBookingEmail } = require("../utils/email");

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);
const worker = new Worker(
  "emailQueue",
  async (job) => {
    if (job.name === "sendBookingEmail") {
      const { email, name, eventTitle } = job.data;
      console.log("📨 Sending email in background...");
      await sendBookingEmail(email, name, eventTitle);
      console.log("✅ Email sent successfully");
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
