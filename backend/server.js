require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

const allowedOrigins = [
  process.env.PUBLIC_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : null,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Configuration des sessions (requis pour passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'naguida-food-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Servir le frontend statique
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/categories',  require('./routes/categories'));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
