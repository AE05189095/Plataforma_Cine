import nodemailer from 'nodemailer';

export const sendConfirmationEmail = async (to, purchaseDetails) => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const { movie, date, time, room, seat, total, code } = purchaseDetails;

  const mailOptions = {
    from: `"CineGT" <${testAccount.user}>`,
    to,
    subject: 'Confirmación de compra - Plataforma Cine',
    html: `
      <div style="background-color:#0D1B2A; color:#F8F9FA; padding:20px; font-family:sans-serif;">
        <h2 style="color:#F1C40F;">🎬 Confirmación de compra - CineGT</h2>
        <p>Hola,</p>
        <p>Gracias por tu compra. Aquí están los detalles:</p>
        <ul style="list-style:none; padding:0;">
          <li><strong>Película:</strong> ${movie}</li>
          <li><strong>Fecha:</strong> ${date}</li>
          <li><strong>Hora:</strong> ${time}</li>
          <li><strong>Sala:</strong> ${room}</li>
          <li><strong>Asientos:</strong> ${seat}</li>
          <li><strong>Total Pagado:</strong> Q${total}</li>
          <li><strong>Código:</strong> <span style="color:#E63946;">${code}</span></li>
        </ul>
        <p>Nos vemos en el cine 🍿</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('📧 Email enviado:', info.messageId);
  console.log('🔗 Vista previa:', nodemailer.getTestMessageUrl(info));
};
