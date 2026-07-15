const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function genNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `P-${n}`;
}

// PUBLIC: bemor tanlagan doktor+sana uchun band bo'lgan vaqtlarni ko'radi (forma to'ldirishdan oldin)
router.get("/booked-times", async (req, res) => {
  const { doctorId, date } = req.query || {};
  if (!doctorId || !date) return res.json([]);
  try {
    const { rows } = await pool.query(
      "SELECT appt_time FROM appointments WHERE doctor_id = $1 AND appt_date = $2",
      [doctorId, date]
    );
    res.json(rows.map((r) => r.appt_time));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// PUBLIC: bemor navbatga yoziladi
router.post("/", async (req, res) => {
  const { patientName, phone, department, doctorId, date, time, note } = req.body || {};
  if (!patientName || !phone || !department || !date || !time) {
    return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
  }
  try {
    // Shu doktorga shu sana+vaqt band qilinganmi tekshiramiz (faqat aniq doktor tanlangan bo'lsa)
    if (doctorId) {
      const clash = await pool.query(
        "SELECT id FROM appointments WHERE doctor_id = $1 AND appt_date = $2 AND appt_time = $3",
        [doctorId, date, time]
      );
      if (clash.rows.length > 0) {
        return res.status(409).json({ error: "Bu vaqt shu doktorga band. Boshqa vaqt yoki doktorni tanlang." });
      }
    }
    const number = genNumber();
    const { rows } = await pool.query(
      `INSERT INTO appointments (number, patient_name, phone, department, doctor_id, appt_date, appt_time, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [number, patientName, phone, department, doctorId || null, date, time, note || null]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Bu vaqt shu doktorga band. Boshqa vaqt yoki doktorni tanlang." });
    }
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: barcha navbatlar
router.get("/all", requireAuth(["admin"]), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, d.name AS doctor_name FROM appointments a
       LEFT JOIN doctors d ON d.id = a.doctor_id
       ORDER BY appt_date ASC, appt_time ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// DOCTOR: faqat o'ziga tegishli navbatlar
router.get("/mine", requireAuth(["doctor"]), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM appointments WHERE doctor_id = $1 ORDER BY appt_date ASC, appt_time ASC`,
      [req.user.doctorId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// DOCTOR: o'ziga tegishli navbatni bajarilgan deb belgilash
router.patch("/:id/done", requireAuth(["doctor"]), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM appointments WHERE id = $1", [req.params.id]);
    const appt = rows[0];
    if (!appt) return res.status(404).json({ error: "Navbat topilmadi" });
    if (appt.doctor_id !== req.user.doctorId) return res.status(403).json({ error: "Ruxsat yo'q" });
    const updated = await pool.query(
      "UPDATE appointments SET done = NOT done WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(updated.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
