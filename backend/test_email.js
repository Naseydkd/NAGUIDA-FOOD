require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test d'envoi
async function testEmail() {
  console.log('🔍 Vérification de la configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configuré' : '❌ Non configuré');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('\n📧 Envoi du test email...\n');

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // S'envoyer à soi-même pour le test
      subject: '🧪 Test - NAGUIDA FOOD Notifications',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6f00;">🍲 NAGUIDA FOOD</h2>
          <h3 style="color: #2e7d32;">✅ Test réussi !</h3>
          <p>Ce message confirme que votre système d'envoi d'emails est <strong>opérationnel</strong>.</p>
          <p>Vous pouvez maintenant utiliser les fonctionnalités suivantes :</p>
          <ul>
            <li>Réinitialisation de mot de passe</li>
            <li>Notifications de commandes</li>
            <li>Autres emails automatiques</li>
          </ul>
          <p style="color:#666; font-size:14px; margin-top:30px;">
            Test envoyé le ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('📬 ID du message:', info.messageId);
    console.log('\n💡 Vérifiez votre boîte email:', process.env.EMAIL_USER);
    console.log('   (Pensez à vérifier les spams si vous ne le trouvez pas)\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:');
    console.error(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('\n🔧 Solutions possibles:');
      console.error('   1. Vérifiez que EMAIL_USER est correct');
      console.error('   2. Vérifiez que EMAIL_PASS est le mot de passe d\'application (16 caractères)');
      console.error('   3. Vérifiez que la validation en 2 étapes est activée sur Gmail');
    }
  }
}

testEmail();
