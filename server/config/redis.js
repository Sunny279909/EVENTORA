const { createClient } = require("redis");

let redisClient = null;

try {
  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Error:", err.message);
    });

    (async () => {
      await redisClient.connect();
      console.log("Connected to Redis");
    })();
  } else {
    console.log("Redis disabled");
  }
} catch (error) {
  console.log("Redis unavailable");
}

module.exports = redisClient;
