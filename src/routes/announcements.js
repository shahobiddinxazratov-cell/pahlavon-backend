const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// PUBLIC: faqat faol e'lonlar (agar hech narsa bo'lmasa, bo'sh ro'yxat qaytadi)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, body, created_at FROM announcements WHERE active = true ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: yangi e'lon qo'shish
router.post("/", requireAuth(["admin"]), async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Sarlavha majburiy" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO announcements (title, body, active) VALUES ($1, $2, true) RETURNING *",
      [title, body || null]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: e'lonni o'chirish
router.delete("/:id", requireAuth(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: hamma e'lonlarni ko'rish (faol va nofaol)
router.get("/all", requireAuth(["admin"]), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
