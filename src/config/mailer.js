const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "45097e6152f889",
      pass: "7aa44ae1ac9642"
    }
  });

  transport.use('compile', hbs({
    viewEngine: {
      defaultLayout: undefined,
      partialsDir: path.resolve('./src/mail/')
    },
    viewPath: path.resolve('./src/mail/'),
    extName: '.html',
  }));

  module.exports = transport;