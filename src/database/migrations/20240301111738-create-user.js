"use strict";

const { sequelize } = require("../../models/user.model");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("male", "female", "not_specified"),
        allowNull: false,
        defaultValue: "not_specified",
      },
      birthdate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      profile: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      organization: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
