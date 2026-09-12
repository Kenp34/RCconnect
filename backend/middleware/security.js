const helmet = require('helmet');

const helmetConfig = helmet({
  // Politique de sécurité du contenu — autorise vos propres ressources
  // + les images uploadées + la connexion Socket.io
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.CLIENT_URL || "http://localhost:5173"],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL || "http://localhost:5173",
        "ws://localhost:5001", // Socket.io en développement
      ],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // souvent nécessaire pour le CSS injecté par React
    },
  },

  // Autorise le chargement d'images/documents uploadés depuis un autre domaine
  // (utile si le frontend et le backend ne sont pas sur le même domaine en prod)
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = helmetConfig;