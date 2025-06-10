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
    this.express.disable("x-powered-by");

    this.express.use(helmet());

    this.express.use(express.json());

    this.express.use(express.urlencoded({ extended: true }));

    const corsOptions = {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.express.use(cors(corsOptions));
  }

  routes() {
    this.express.use(require("../src/routes/index"));
  }
}

module.exports = new App().express;
