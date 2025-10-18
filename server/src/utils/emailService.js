const nodemailer = require("nodemailer");

async function sendConfirmationEmail(email, purchase) {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background-color: #1a202c; color: #ffffff; padding: 16px 24px;">
          <h2 style="margin: 0;">🎬 CineGT - Confirmación de Compra</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Hola, gracias por tu compra en <strong>CineGT</strong>. Aquí están los detalles de tu reserva:</p>
          <ul style="font-size: 15px; line-height: 1.6; padding-left: 20px;">
            <li><strong>Película:</strong> ${purchase.movieTitle}</li>
            <li><strong>Sala:</strong> ${purchase.hallName}</li>
            <li><strong>Asientos:</strong> ${purchase.seats.join(", ")}</li>
            <li><strong>Total:</strong> Q${purchase.totalPrice}</li>
            <li><strong>Código:</strong> ${purchase._id}</li>
          </ul>
          <p style="margin-top: 10px;">¡Disfruta la función! 🍿</p>
        </div>
        <div style="background-color: #edf2f7; text-align: center; padding: 12px; font-size: 13px; color: #4a5568;">
          CineGT © 2025 · Todos los derechos reservados
        </div>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"CineGT" <no-reply@cinegt.com>',
    to: email,
    subject: "Tu entrada de cine",
    html,
  });

  return nodemailer.getTestMessageUrl(info);
}

module.exports = { sendConfirmationEmail };
