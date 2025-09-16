const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const mentorRoutes = require("./routes/mentors");
const journalRoutes = require("./routes/journal");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const { initializePlatform } = require("./utils/bootstrap");
const { validateMailSettings } = require("./utils/email");

let mailSettings;

try {
  mailSettings = validateMailSettings();
  console.log(
    `Validated SMTP configuration for ${mailSettings.host}:${mailSettings.port}`
  );
} catch (error) {
  console.error("SMTP configuration error:", error.message);
  process.exit(1);
}

const app = express();
app.locals.mailSettings = mailSettings;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : undefined;

const corsOptions = allowedOrigins
  ? { origin: allowedOrigins, credentials: true }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({ status: "ok", time: result.rows[0].time });
  } catch (error) {
    console.error("Health check error:", error.message);
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
  console.error("Unexpected error:", err);
  if (res.headersSent) {
    return next(err);
  }

  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

initializePlatform()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Aleya API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialise platform", error);
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
