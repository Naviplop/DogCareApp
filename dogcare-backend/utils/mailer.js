const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ivan.jrz.rdz@gmail.com', // Cambia esto por tu correo
        pass: 'fxrc pwxc vjmc such'       // Usa una contraseña de aplicación
    }
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: 'ivan.jrz.rdz@gmail.com',
        to,
        subject,
        text
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
