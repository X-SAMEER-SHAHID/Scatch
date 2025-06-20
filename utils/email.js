const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email function
exports.sendEmail = async ({ email, subject, template, data }) => {
    try {
        // Render email template
        const templatePath = path.join(__dirname, `../views/emails/${template}.ejs`);
        const html = await ejs.renderFile(templatePath, data);

        // Send email
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject,
            html
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Email templates
exports.emailTemplates = {
    // Order confirmation email
    orderConfirmation: (data) => ({
        subject: 'Order Confirmation',
        template: 'order-confirmation',
        data
    }),

    // Order status update email
    orderStatusUpdate: (data) => ({
        subject: 'Order Status Updated',
        template: 'order-status-update',
        data
    }),

    // Order cancellation email
    orderCancelled: (data) => ({
        subject: 'Order Cancelled',
        template: 'order-cancelled',
        data
    }),

    // Password reset email
    passwordReset: (data) => ({
        subject: 'Password Reset Request',
        template: 'password-reset',
        data
    }),

    // Email verification
    emailVerification: (data) => ({
        subject: 'Verify Your Email',
        template: 'email-verification',
        data
    }),

    // Welcome email
    welcome: (data) => ({
        subject: 'Welcome to Our Store',
        template: 'welcome',
        data
    })
}; 