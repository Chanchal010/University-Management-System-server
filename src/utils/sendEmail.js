const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Using 'gmail' service instead of custom host/port
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD  // This should be an app password for Gmail
      },
      tls: {
        rejectUnauthorized: false // Helps with self-signed certificates
      },
      // Add DKIM if available
      dkim: process.env.DKIM_PRIVATE_KEY ? {
        domainName: process.env.DKIM_DOMAIN || process.env.EMAIL_FROM_ADDRESS.split('@')[1],
        keySelector: process.env.DKIM_SELECTOR || 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY
      } : undefined
    });

    // Verify connection configuration
    await transporter.verify();
    // console.log('SMTP connection verified successfully');

    // Define email options
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.email,
      subject: options.subject,
      text: options.message || '',
      html: options.html || options.message || '',
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM_ADDRESS}?subject=Unsubscribe>`,
        'X-Report-Abuse': `<mailto:${process.env.EMAIL_FROM_ADDRESS}?subject=Report Abuse>`
      }
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully to:', options.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;