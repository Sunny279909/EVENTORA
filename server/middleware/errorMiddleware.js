const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`);

  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message,
  });
};
