// Configuration - fonctionne en local et en production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupPasswordToggles();
    setupGoogleAuth();
    checkIfAlreadyLoggedIn();
    checkGoogleAuthCallback();
});

// ===========================
// TOGGLE VISIBILITÉ MOT DE PASSE
// ===========================

function setupPasswordToggles() {
    // Sélectionner tous les boutons toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Récupérer l'input cible
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('.eye-icon');
            
            // Toggle le type d'input
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈'; // Yeux fermés
                this.setAttribute('title', 'Masquer le mot de passe');
            } else {
                input.type = 'password';
                icon.textContent = '👁️'; // Yeux ouverts
                this.setAttribute('title', 'Afficher le mot de passe');
            }
        });
    });
}

// ===========================
// GOOGLE OAUTH
// ===========================

function setupGoogleAuth() {
    // Boutons Google Login et Signup
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnGoogleSignup = document.getElementById('btn-google-signup');
    
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', handleGoogleAuth);
    }
    
    if (btnGoogleSignup) {
        btnGoogleSignup.addEventListener('click', handleGoogleAuth);
    }
}

function handleGoogleAuth(e) {
    e.preventDefault();
    
    // Ajouter une classe de loading
    this.classList.add('loading');
    
    // Rediriger vers l'authentification Google
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;
    
    window.location.href = `${baseUrl}/api/auth/google`;
}

function checkGoogleAuthCallback() {
    // Vérifier si on revient d'une authentification Google
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('google_auth') === 'success') {
        try {
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                
                // Sauvegarder l'utilisateur
                if (user.is_admin) {
                    localStorage.setItem('currentAdmin', JSON.stringify(user));
                    showMessage('Connexion Google réussie ! Redirection...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1000);
                } else {
                    // Utilisateur normal
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    showMessage('Connexion Google réussie !', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Erreur parsing user Google:', error);
            showMessage('Erreur lors de la connexion Google', 'error');
        }
    } else if (params.get('error') === 'google_auth_failed') {
        showMessage('Erreur lors de l\'authentification Google. Veuillez réessayer.', 'error');
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ===========================
// VÉRIFICATION CONNEXION
// ===========================

function checkIfAlreadyLoggedIn() {
    const savedAdmin = localStorage.getItem('currentAdmin');
    if (savedAdmin) {
        window.location.href = 'admin.html';
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Toggle entre login et signup
    document.getElementById('btn-toggle-signup').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('form-signup');
    });

    document.getElementById('btn-toggle-login').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('form-login');
    });

    document.getElementById('btn-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('form-forgot');
    });

    document.getElementById('btn-back-login').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('form-login');
    });

    // Formulaires
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('form-signup').addEventListener('submit', handleSignup);
    document.getElementById('form-forgot').addEventListener('submit', handleForgotPassword);
    document.getElementById('form-reset').addEventListener('submit', handleResetPassword);

    // Vérifier si on arrive avec un token de reset
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'reset' && params.get('token')) {
        showForm('form-reset');
    }
}

function showForm(formId) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
    clearMessages();
}

function toggleForms() {
    showForm(document.getElementById('form-login').classList.contains('active') ? 'form-signup' : 'form-login');
}

// ===========================
// CONNEXION
// ===========================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showMessage('Connexion en cours...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Erreur de connexion', 'error');
            return;
        }

        // Vérifier si c'est un admin
        if (data.user.is_admin) {
            // Sauvegarder l'admin
            localStorage.setItem('currentAdmin', JSON.stringify(data.user));
            showMessage('Connexion réussie! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            showMessage('Accès refusé. Seuls les administrateurs peuvent accéder à cette page.', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    }
}

// ===========================
// INSCRIPTION
// ===========================

async function handleSignup(e) {
    e.preventDefault();

    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    // Vérifier que les mots de passe correspondent
    if (password !== passwordConfirm) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    // Vérifier que l'email contient "admin" (simple vérification)
    if (!email.toLowerCase().includes('admin')) {
        showMessage('Seuls les administrateurs peuvent créer un compte ici', 'error');
        return;
    }

    showMessage('Inscription en cours...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Erreur lors de l\'inscription', 'error');
            return;
        }

        showMessage('Inscription réussie! Connectez-vous maintenant.', 'success');
        
        // Remplir le formulaire de login avec l'email
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = '';
        
        // Basculer vers le formulaire de login
        setTimeout(() => {
            toggleForms();
        }, 1500);
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur lors de l\'inscription. Veuillez réessayer.', 'error');
    }
}

// ===========================
// MOT DE PASSE OUBLIÉ
// ===========================

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    showMessage('Envoi en cours...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) {
            showMessage(data.error || 'Erreur lors de l\'envoi', 'error');
            return;
        }
        showMessage('Si cet email existe, un lien de réinitialisation a été envoyé.', 'success');
    } catch (error) {
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    }
}

// ===========================
// RÉINITIALISATION MOT DE PASSE
// ===========================

async function handleResetPassword(e) {
    e.preventDefault();
    const password = document.getElementById('reset-password').value;
    const passwordConfirm = document.getElementById('reset-password-confirm').value;

    if (password !== passwordConfirm) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
        showMessage('Token invalide', 'error');
        return;
    }

    showMessage('Réinitialisation en cours...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await response.json();
        if (!response.ok) {
            showMessage(data.error || 'Erreur lors de la réinitialisation', 'error');
            return;
        }
        showMessage('Mot de passe réinitialisé avec succès ! Redirection...', 'success');
        setTimeout(() => {
            window.location.href = 'admin-auth.html';
        }, 2000);
    } catch (error) {
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    }
}

// ===========================
// MESSAGES
// ===========================

function showMessage(message, type = 'info') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = `status-message show ${type}`;
}

function clearMessages() {
    const statusDiv = document.getElementById('status-message');
    statusDiv.className = 'status-message';
    statusDiv.textContent = '';
}
// ===========================
// EFFETS VISUELS MODERNES
// ===========================

// Améliorer les effets de focus sur les inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Effet de focus amélioré
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Effet de saisie
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.parentElement.classList.add('has-content');
            } else {
                this.parentElement.classList.remove('has-content');
            }
        });
    });
    
    // Effet de parallaxe léger sur les info-boxes
    const infoBoxes = document.querySelectorAll('.info-box');
    
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        infoBoxes.forEach((box, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            
            box.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
});

