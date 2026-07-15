const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// PUBLIC: ijtimoiy tarmoq havolalari
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, platform, url FROM social_links ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: havola qo'shish
router.post("/", requireAuth(["admin"]), async (req, res) => {
  const { platform, url } = req.body || {};
  if (!platform || !url) return res.status(400).json({ error: "Platforma va havolani kiriting" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO social_links (platform, url) VALUES ($1, $2) RETURNING *",
      [platform, url]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: havolani o'chirish
router.delete("/:id", requireAuth(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM social_links WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
