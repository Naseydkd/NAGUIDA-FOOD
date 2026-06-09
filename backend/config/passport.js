const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db');
const bcrypt = require('bcryptjs');

const hasGoogleOAuthConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL;

// Configuration de la stratégie Google OAuth
if (hasGoogleOAuthConfig) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extraire les informations du profil Google
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;
      const displayName = profile.displayName;

      // Vérifier si l'utilisateur existe déjà avec cet email ou google_id
      let result = await db.query(
        'SELECT * FROM users WHERE email = $1 OR google_id = $2',
        [email, googleId]
      );

      let user = result.rows[0];

      if (user) {
        // Si l'utilisateur existe mais n'a pas de google_id, on le met à jour
        if (!user.google_id) {
          await db.query(
            'UPDATE users SET google_id = $1 WHERE id = $2',
            [googleId, user.id]
          );
          user.google_id = googleId;
        }
      } else {
        // Créer un nouvel utilisateur
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        result = await db.query(
          `INSERT INTO users (
            email, username, password_hash, first_name, last_name, 
            google_id, phone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [email, username, randomPassword, firstName, lastName || '', googleId, '']
        );
        user = result.rows[0];
      }

      // Supprimer le password_hash avant de retourner l'utilisateur
      delete user.password_hash;
      return done(null, user);
    } catch (error) {
      console.error('Erreur Google OAuth:', error);
      return done(error, null);
    }
  }
));
}

// Sérialisation de l'utilisateur pour la session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Désérialisation de l'utilisateur depuis la session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query(
      'SELECT id, email, username, first_name, last_name, phone, address, city, postal_code, latitude, longitude, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
