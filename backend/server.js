const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur <http://localhost>:${PORT}`);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts',require('./routes/posts'));
//app.use('/api/groups',require('./routes/groups'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 5001,
    () => console.log('Serveur démarré')))
  .catch(err => console.error(err));