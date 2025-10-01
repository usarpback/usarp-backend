require("dotenv").config();

module.exports = {
  dialect: process.env.DIALECT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT),
  define: {
    timestamps: true,
    underscored: true,
  },
};
