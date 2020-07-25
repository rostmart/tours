const nodemailer = require('nodemailer');
const pug = require('pug'); // for sending html in mails
const htmlToText = require('html-to-text'); // fo sending plain text in mails

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mart&Company <${process.env.EMAIL_FROM}>`
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SendGrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    // 1) Create and send a transporter
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  //Sends the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, { //pug.renderFile -
                                             // takes a pug code and renders it to html; {__dirname} -
                                             // the location of currently running script (utility folder)
      firstName: this.firstName, // data will be passed to a render file
      url: this.url,
      subject
    });
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html) //sends also plain text in email
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password Reset Token (Valid 10 minutes only!!!)');
  }
};

//const sendEmail = async options => {
  // 1) Create a transporter
  // const transporter = nodemailer.createTransport({
  //   host: process.env.EMAIL_HOST,
  //   port: process.env.EMAIL_PORT,
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD
  //   }
  // });

  // 2) Define the email options
//   const mailOptions = {
//     from: 'Mart&Company <mart0408@ukr.net',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     //html:
// };

  // 3) Send the email
  //await transporter.sendMail(mailOptions)
//};
