const nodemailer = require('nodemailer');

// Create transporter only if email credentials are configured
let transporter = null;

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  return transporter;
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      console.log('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const info = await emailTransporter.sendMail({
      from: `"Dayflow HRMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error, just log it
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };

