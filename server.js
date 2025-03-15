const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const appointmentRoutes = require("./routes/appointmentroutes");
const opdRoutes = require("./routes/opdroutes"); // OPD Ticket Routes

dotenv.config();
connectDB();

const app = express();

// ✅ Secure and dynamic CORS policy
const allowedOrigins = ["https://kartikeycare.vercel.app", "http://localhost:3000"];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(express.json());

// ✅ Register Routes
app.use("/api/appointments", appointmentRoutes);
app.use("/api/opd", opdRoutes);

// ✅ Debug: Log all registered routes
console.log("Registered Routes:");
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});

// ✅ Handle 404 Routes
app.use((req, res) => {
    res.status(404).json({ error: "API route not found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} at ${new Date().toLocaleString()}`));