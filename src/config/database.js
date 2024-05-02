require("dotenv").config();

module.exports = {
  dialect: "mariadb",
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: 'db',
  port: process.env.DB_PORT,
  define: {
    timestamps: true, // Habilitar created_at, updated_at
    underscored: true, // Atributos em snake case
  },
};