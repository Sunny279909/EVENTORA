const Event = require("../models/Event");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

// 🔥 GET ALL EVENTS
exports.getAllEvents = async (req, res, next) => {
  try {
    const cacheKey = `events:${JSON.stringify(req.query)}`;

    logger.info(`Checking cache for ${cacheKey}`);

    // ✅ Check Redis cache
    if (redisClient?.isOpen) {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.info("Serving events from cache");
        return res.json(JSON.parse(cachedData));
      }
    }

    logger.info("Fetching events from DB");

    const filters = {};

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.location) {
      filters.location = req.query.location;
    }

    const events = await Event.find(filters);

    // ✅ Store in Redis cache
    if (redisClient?.isOpen) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(events));

      logger.info("Events cached successfully");
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// 🔥 GET SINGLE EVENT
exports.getEventById = async (req, res, next) => {
  try {
    const cacheKey = `event:${req.params.id}`;

    logger.info(`Checking cache for ${cacheKey}`);

    // ✅ Check cache
    if (redisClient?.isOpen) {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.info("Serving single event from cache");
        return res.json(JSON.parse(cachedData));
      }
    }

    logger.info("Fetching single event from DB");

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ✅ Store in cache
    if (redisClient?.isOpen) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(event));

      logger.info("Single event cached successfully");
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// 🔥 CREATE EVENT
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      date,
      location,
      category,
      totalSeats,
      availableSeats,
      ticketPrice,
      imageUrl,
    } = req.body;

    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      totalSeats,
      availableSeats,
      ticketPrice,
      imageUrl: imageUrl || null,
      createdBy: req.user._id,
    });

    await event.save();

    logger.info("Clearing cache after create");

    // ✅ Clear event list cache
    if (redisClient?.isOpen) {
      const keys = await redisClient.keys("events:*");

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// 🔥 UPDATE EVENT
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    logger.info("Clearing cache after update");

    // ✅ Clear cache
    if (redisClient?.isOpen) {
      const keys = await redisClient.keys("events:*");

      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      await redisClient.del(`event:${req.params.id}`);
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// 🔥 DELETE EVENT
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    await event.deleteOne();

    logger.info("Clearing cache after delete");

    // ✅ Clear cache
    if (redisClient?.isOpen) {
      const keys = await redisClient.keys("events:*");

      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      await redisClient.del(`event:${req.params.id}`);
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
