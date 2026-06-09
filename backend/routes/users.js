const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Transporter email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST register
router.post('/register', async (req, res) => {
  const { email, username, password, first_name, last_name, phone, address, city, postal_code, latitude, longitude } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: 'Champs requis: email, username, password' });
  if (!first_name || !phone)
    return res.status(400).json({ error: 'Le prénom et le numéro de téléphone sont obligatoires' });
  try {
    const exists = await db.query('SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (exists.rows.find(u => u.email === email))
      return res.status(400).json({ error: 'Email déjà utilisé' });
    if (exists.rows.find(u => u.username === username))
      return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, phone, address, city, postal_code, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [email, username, password_hash, first_name, last_name, phone, address, city, postal_code, latitude || null, longitude || null]
    );
    const user = rows[0];
    delete user.password_hash;
    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    delete user.password_hash;
    res.json({ message: 'Connexion réussie', user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id,email,username,first_name,last_name,phone,address,city,postal_code,latitude,longitude,is_admin,created_at FROM users');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one user
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id,email,username,first_name,last_name,phone,address,city,postal_code,latitude,longitude,is_admin,created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const u = existing[0];
    const { first_name=u.first_name, last_name=u.last_name, phone=u.phone,
            address=u.address, city=u.city, postal_code=u.postal_code, 
            latitude=u.latitude, longitude=u.longitude } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET first_name=$1, last_name=$2, phone=$3, address=$4, city=$5, postal_code=$6, latitude=$7, longitude=$8
       WHERE id=$9 RETURNING id,email,username,first_name,last_name,phone,address,city,postal_code,latitude,longitude,is_admin,created_at`,
      [first_name, last_name, phone, address, city, postal_code, latitude, longitude, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /forgot-password - envoyer un email de réinitialisation
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    // On répond toujours avec succès pour ne pas révéler si l'email existe
    if (!rows[0]) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await db.query(
      'UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE email=$3',
      [token, expires, email]
    );

    const baseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'votre-site.com'}`))
      : 'http://localhost:3000';

    const resetLink = `${baseUrl}/admin-auth.html?token=${token}&action=reset`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🍲 NAGUIDA FOOD - Réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6f00;">🍲 NAGUIDA FOOD</h2>
          <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetLink}" style="display:inline-block; padding:14px 28px; background:linear-gradient(135deg,#ff6f00,#2e7d32,#d4af37); color:white; text-decoration:none; border-radius:8px; font-weight:bold; margin:20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#666; font-size:14px;">Ce lien expire dans <strong>1 heure</strong>.</p>
          <p style="color:#666; font-size:14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      `
    });

    res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (e) {
    console.error('Erreur forgot-password:', e);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// POST /reset-password - réinitialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
  if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE reset_token=$1 AND reset_token_expires > NOW()',
      [token]
    );

    if (!rows[0]) return res.status(400).json({ error: 'Lien invalide ou expiré' });

    const password_hash = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2',
      [password_hash, rows[0].id]
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
