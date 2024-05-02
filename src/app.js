const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

class App {
  constructor() {
    this.express = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    // disable `X-Powered-By` header that reveals information about the server
    this.express.disable("x-powered-by");

    // set security HTTP headers
    this.express.use(helmet());

    // parse json request body
    this.express.use(express.json());

    // parse urlencoded request body
    this.express.use(express.urlencoded({ extended: true }));

    // enable cors
    this.express.use(cors());
    this.express.options("*", cors());
  }

  routes() {
    this.express.use(require("../src/routes/index"));
  }
}

module.exports = new App().express;
