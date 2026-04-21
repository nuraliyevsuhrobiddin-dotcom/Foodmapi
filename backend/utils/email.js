const nodemailer = require('nodemailer');

const getEmailConfig = () => ({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: String(process.env.MAIL_SECURE || 'false') === 'true',
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_FROM || process.env.MAIL_USER,
});

const isEmailConfigured = () => {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

const createTransporter = () => {
  const config = getEmailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const sendPasswordResetEmail = async ({ to, username, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email sozlamalari to'liq kiritilmagan");
  }

  const transporter = createTransporter();
  const config = getEmailConfig();

  const subject = "FoodMap parolni tiklash kodi";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0f172a; color: #ffffff; border-radius: 20px;">
      <h2 style="margin: 0 0 16px; font-size: 24px;">Salom, ${username || 'foydalanuvchi'}!</h2>
      <p style="margin: 0 0 16px; color: #cbd5e1; line-height: 1.6;">
        FoodMap hisobingiz uchun parolni tiklash kodi so'raldi.
      </p>
      <div style="margin: 24px 0; padding: 18px 20px; border-radius: 16px; background: #1e293b; text-align: center;">
        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 0.28em; color: #ffcc33;">${code}</span>
      </div>
      <p style="margin: 0 0 12px; color: #cbd5e1; line-height: 1.6;">
        Kod 10 daqiqa davomida amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
      </p>
      <p style="margin: 0; color: #94a3b8; font-size: 14px;">FoodMap jamoasi</p>
    </div>
  `;

  const text = `Salom, ${username || 'foydalanuvchi'}! FoodMap parolni tiklash kodi: ${code}. Kod 10 daqiqa amal qiladi.`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};
