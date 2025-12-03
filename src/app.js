const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");

class App {
  constructor() {
    this.express = express();
    this.middlewares();
    this.setupSwagger();
    this.routes();
  }

  middlewares() {
    this.express.disable("x-powered-by");

    this.express.use(helmet());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    const corsOptions = {
      origin: process.env.CORS_ORIGIN || "http://merry-gratitude-production.up.railway.app",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.express.use(cors(corsOptions));
  }

  routes() {
    this.express.use(require("../src/routes/index"));
  }

  setupSwagger() {
    try {
      const specPath = path.join(__dirname, "..", "openapi.yaml");
      const file = fs.readFileSync(specPath, "utf8");
      const swaggerDocument = yaml.load(file);

      this.express.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument),
      );

      this.express.get("/docs/json", (req, res) => res.json(swaggerDocument));

      console.log("Swagger disponível em /docs");
    } catch (err) {
      console.warn(
        "Não foi possível carregar o openapi.yaml para o Swagger:",
        err.message,
      );
    }
  }
}

module.exports = new App().express;
