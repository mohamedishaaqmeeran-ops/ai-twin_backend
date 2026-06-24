const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");
const adminRoutes = require("./modules/admin/admin.routes");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://ai-twin-63zh.vercel.app",
  "https://ai-twin-git-1064507568780.asia-south1.run.app",
  "https://twinn.live",
  "https://www.twinn.live"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "AI Twin API is operational",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Resource not found",
  });
});

app.use((err, req, res, next) => {
  console.error("System Error Boundary:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

module.exports = app;