const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.json({
        message: 'API AcademiConnect opérationnelle'
    });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur <http://localhost>:${PORT}`);
});



const path = require('path');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authroutes=require('./routes/auth');
// Routes
app.use('/api/auth',authroutes);
//app.use('/api/users',require('./routes/users'));
//app.use('/api/posts',require('./routes/posts'));
//app.use('/api/groups',require('./routes/groups'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(5001, () => console.log('Serveur démarré')))
  .catch(err => console.error(err));
app.use(express.urlencoded({extended:true}))