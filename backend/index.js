const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());           // allow cross-origin requests
app.use(express.json());   // parse JSON bodies

// ✅ Simple route
app.get("/api", (req, res) => {
  res.json({ time: new Date().toISOString() });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
