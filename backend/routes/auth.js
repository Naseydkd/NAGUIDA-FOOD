const router = require('express').Router();
const passport = require('../config/passport');

// Route pour démarrer l'authentification Google
router.get('/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      return res.status(503).json({ error: 'Google OAuth non configuré' });
    }
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Route de callback Google OAuth
router.get('/google/callback',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      return res.redirect('/admin-auth.html?error=google_oauth_not_configured');
    }
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: '/admin-auth.html?error=google_auth_failed',
    session: false
  }),
  (req, res) => {
    // Authentification réussie
    // On envoie l'utilisateur au frontend avec ses infos
    const user = req.user;
    
    // Rediriger vers la page appropriée avec les données utilisateur
    if (user.is_admin) {
      // Admin → Dashboard admin
      res.redirect(`/admin.html?google_auth=success&user=${encodeURIComponent(JSON.stringify(user))}`);
    } else {
      // Utilisateur normal → Page d'accueil
      res.redirect(`/index.html?google_auth=success&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
  }
);

// Route pour déconnexion
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.json({ message: 'Déconnexion réussie' });
  });
});

// Route pour obtenir l'utilisateur connecté (optionnel)
router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Non authentifié' });
  }
});

module.exports = router;
