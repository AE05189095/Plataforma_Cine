// Utilidad para enviar correos usando nodemailer y Ethereal
const nodemailer = require('nodemailer');

// Esta función crea un transporter de Ethereal automáticamente
async function createTestAccountAndTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return { transporter, testAccount };
}

// Función para enviar correo de confirmación de compra
async function sendPurchaseConfirmation(to, subject, text, html) {
  const { transporter, testAccount } = await createTestAccountAndTransporter();
  const info = await transporter.sendMail({
    from: 'Cine Plataforma <no-reply@cine.com>',
    to,
    subject,
    text,
    html,
  });
  // URL de previsualización en Ethereal
  return nodemailer.getTestMessageUrl(info);
}

module.exports = { sendPurchaseConfirmation };
