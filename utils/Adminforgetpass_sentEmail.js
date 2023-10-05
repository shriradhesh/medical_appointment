const nodemailer = require('nodemailer')

const Adminforgetpass_sentEmail = async (recipientEmail, subject, text) => {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
  
      await transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: recipientEmail,
        subject: subject,
        text: text,
      });
  
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Email not sent: " + error.message);
    }
  };


  module.exports = Adminforgetpass_sentEmail