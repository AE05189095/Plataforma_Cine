import nodemailer from 'nodemailer';

export const sendConfirmationEmail = async (to, purchaseDetails) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { movie, date, time, room, seat, code } = purchaseDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Confirmación de compra - Plataforma Cine',
    html: `
      <h2>¡Gracias por tu compra!</h2>
      <p><strong>Película:</strong> ${movie}</p>
      <p><strong>Fecha:</strong> ${date}</p>
      <p><strong>Hora:</strong> ${time}</p>
      <p><strong>Sala:</strong> ${room}</p>
      <p><strong>Asiento:</strong> ${seat}</p>
      <p><strong>Código de confirmación:</strong> ${code}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
