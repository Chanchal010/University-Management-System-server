const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create a transporter with safer settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD  // This should be an app password for Gmail
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    await transporter.verify();

    // Simple email structure without special handling
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'University Management System',
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: options.email,
      subject: options.subject,
      text: options.message || '',
      html: options.html || options.message || ''
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully to:', options.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;