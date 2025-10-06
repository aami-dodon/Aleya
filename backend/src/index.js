const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { randomUUID } = require("crypto");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const { logger, resolvedLogFile, serializeError } = require("./utils/logger");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const mentorRoutes = require("./routes/mentors");
const journalRoutes = require("./routes/journal");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const { initializePlatform } = require("./utils/bootstrap");
const { validateMailSettings } = require("./utils/email");
const passport = require("./config/passport");
const { paths, components, tags } = require("./docs/swagger");

let mailSettings;

try {
  mailSettings = validateMailSettings();
  logger.info(
    "Validated SMTP configuration for %s:%s",
    mailSettings.host,
    mailSettings.port
  );
} catch (error) {
  logger.error("SMTP configuration error", {
    error: serializeError(error),
  });
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
app.locals.mailSettings = mailSettings;
app.locals.bootId = randomUUID();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Aleya API",
    description:
      "API documentation for Aleya backend services. The documented endpoints require valid authentication unless specified otherwise.",
    version: "1.0.0",
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`,
    },
  ],
  tags,
  components,
  paths,
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./src/index.js", "./src/routes/**/*.js"],
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : undefined;

const corsOptions = allowedOrigins
  ? {
      origin: allowedOrigins,
      credentials: true,
      exposedHeaders: ["X-Aleya-Boot-Id"],
    }
  : { origin: true, credentials: true, exposedHeaders: ["X-Aleya-Boot-Id"] };

app.use((req, res, next) => {
  res.setHeader("X-Aleya-Boot-Id", app.locals.bootId);
  next();
});

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
      maxAge: 10 * 60 * 1000, // 10 minutes (just for OAuth flow)
    },
  })
);

// Initialize Passport for OAuth
app.use(passport.initialize());
app.use(passport.session());

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Returns the API health status.
 *     tags:
 *       - Health
 *     responses:
 *       '200':
 *         description: The API is healthy and can access the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 time:
 *                   type: string
 *                   format: date-time
 *       '500':
 *         description: Database connection failed.
 */
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({ status: "ok", time: result.rows[0].time });
  } catch (error) {
    logger.error("Health check error", { error: serializeError(error) });
    res.status(500).json({ status: "error", message: "Database unreachable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/journal-entries", journalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  logger.error("Unexpected error", { error: serializeError(err) });
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

initializePlatform()
  .then(() => {
    app.listen(PORT, () => {
      logger.info("Aleya API listening on port %s (logs: %s)", PORT, resolvedLogFile);
    });
  })
  .catch((error) => {
    logger.error("Failed to initialise platform", {
      error: serializeError(error),
    });
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: serializeError(reason),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: serializeError(error) });
});
