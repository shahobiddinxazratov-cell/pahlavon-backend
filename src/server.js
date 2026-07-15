const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const doctorsRoutes = require("./routes/doctors");
const appointmentsRoutes = require("./routes/appointments");
const announcementsRoutes = require("./routes/announcements");
const socialRoutes = require("./routes/social");

const app = express();

app.use(cors()); // Boshida hammaga ochiq; xohlasangiz keyin faqat frontend manzilingizga cheklaymiz
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "Pahlavon backend ishlayapti" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/social", socialRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishga tushdi`));
