const rateLimit = require('express-rate-limit');

// ✅ Limiteur strict pour login/register (protection brute-force)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // fenêtre de 5 minutes
  max: 5,                    // 5 tentatives max par IP sur cette fenêtre
  message: { message: 'Trop de tentatives. Réessayez dans 5 minutes.' },
  standardHeaders: true,     // renvoie les infos de quota dans les headers (RateLimit-*)
  legacyHeaders: false,
  skipSuccessfulRequests: true, // une connexion réussie ne compte pas dans le quota
});

// ✅ Limiteur plus permissif pour l'ensemble de l'API
const generalLimiter = rateLimit({
  windowMs:10 * 60 * 1000,
  max: 300,                  // 300 requêtes par IP toutes les 10 minutes
  message: { message: 'Trop de requêtes, merci de ralentir.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };