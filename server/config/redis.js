const { createClient } = require("redis");

let redisClient = null;

if (process.env.REDIS_URL) {
  (async () => {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });

      redisClient.on("error", (err) => {
        console.log("Redis Error:", err.message);
      });

      await redisClient.connect();

      console.log("Connected to Redis");
    } catch (error) {
      console.log("Redis unavailable");
      redisClient = null;
    }
  })();
} else {
  console.log("Redis disabled");
}

module.exports = redisClient;
