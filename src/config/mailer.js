const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mailusarp@gmail.com",
      pass: "ltkksghqobskbreg"
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