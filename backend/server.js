const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: /vercel\.app$/,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}));

app.get('/',(req , res) => {
   res.json({ message: 'RCconnect API'});
})

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rendre io accessible dans les routes
app.set('io', io);

//ratelimit
const { generalLimiter } = require('./middleware/rateLimiter');
const helmetConfig = require('./middleware/security');

// ✅ Sécurité — toujours en tout premier, avant tout le reste
app.use(helmetConfig);
app.use(cors());
app.use(express.json());

app.use('/api/', generalLimiter); // ← s'applique à toutes les routes /api/*


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/groups', require('./routes/groups'));

// Socket.io
require('./socket/index')(io);


// Connexion MongoDB
/*
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    server.listen(5001, () => {
      console.log('✅ Serveur démarré sur http://localhost:5001 :',process.env.MONGODB_URI);
    });
  })
  .catch(err => console.error('❌ Erreur MongoDB:', err));
<<<<<<< HEAD

*/

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        // ⚠️ ICI LA MODIFICATION IMPORTANTE
        const PORT = process.env.PORT || 5001;
        server.listen(PORT, '0.0.0.0', () => {  // ← Écoute sur toutes les IP
            console.log(`✅ Server démarré sur http://0.0.0.0:${PORT}`);
            console.log(`📱 Accès local : http://localhost:${PORT}`);
            console.log(`📱 Accès réseau : http://192.168.1.171:${PORT}`);
        });
    })
    .catch(err => console.error('❌ Erreur MongoDB:', err));