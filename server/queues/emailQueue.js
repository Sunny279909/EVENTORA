let emailQueue = null;

try {
  if (process.env.REDIS_URL) {
    const { Queue } = require("bullmq");
    const IORedis = require("ioredis");

    const connection = new IORedis(process.env.REDIS_URL);

    emailQueue = new Queue("emailQueue", {
      connection,
    });

    console.log("BullMQ connected");
  } else {
    console.log("BullMQ disabled");
  }
} catch (error) {
  console.log("BullMQ unavailable");
}

module.exports = emailQueue;
