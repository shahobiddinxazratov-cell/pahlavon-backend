const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function requireAuth(allowedRoles) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token topilmadi" });
    try {
      const payload = jwt.verify(token, SECRET);
      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "Ruxsat yo'q" });
      }
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: "Token yaroqsiz yoki muddati o'tgan" });
    }
  };
}

module.exports = { requireAuth, SECRET };
