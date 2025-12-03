const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_LOGIN ,
      pass: process.env.EMAIL_PASSWORD
    },
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