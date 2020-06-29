const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to =user.to;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Solomon Umeh <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'SendinBlue',
                auth: {
                    user: process.env.SENDINBLUE_USERNAME,
                    pass: process.env.SENDINBLUE_PASSWORD
                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
           
        });
    }

    async send(template, subject) {
        // send the actual email
            const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
                firstName: this.firstName,
                url: this.url,
                subject
            });
        // Define email options
        const mailOptions = {
            from: this.from,
            to:this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        }

        await this.newTransport().sendMail(mailOptions);

    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)');
    }
}
