"use strict";

const { sequelize } = require("../../models/user.model");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The 'Full Name' field is required.",
          },
          notEmpty: {
            msg: "The 'Full Name' field cannot be empty",
          },
          is: {
            args: /^[a-zA-ZÀ-ÿ\s]+$/,
            msg: "The full name must contain only uppercase and lowercase letters.",
          },
        },
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: "The 'email' field is required.",
          },
          notEmpty: {
            msg: "The 'email' field cannot be empty",
          },
          isEmail: {
            msg: "The email is invalid",
          },
          is: {
            args: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/i,
            msg: "The member email contains invalid characters or format",
          },
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The 'password' field is required.",
          },
          notEmpty: {
            msg: "The 'password' field cannot be empty",
          },
        },
      },
      gender: {
        type: Sequelize.ENUM(
          "Feminino",
          "Masculino",
          "Não binário",
          "Prefiro não informar",
        ),
        allowNull: false,
        defaultValue: "Prefiro não informar",
        validate: {
          isIn: {
            args: [
              ["Feminino", "Masculino", "Não binário", "Prefiro não informar"],
            ],
            msg: "Gender must be 'Feminino', 'Masculino', 'Não binário', or 'Prefiro não informar'.",
          },
        },
      },
      birthdate: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The 'birth date' field is required.",
          },
          notEmpty: {
            msg: "The 'birth date' field cannot be empty",
          },
        },
      },
      profile: {
        type: Sequelize.ENUM(
          "Estudante de Graduação",
          "Estudante de Pós-Graduação",
          "Professor",
          "Profissional da Indústria",
        ),
        allowNull: false,
        validate: {
          isIn: {
            args: [
              [
                "Estudante de Graduação",
                "Estudante de Pós-Graduação",
                "Professor",
                "Profissional da Indústria",
              ],
            ],
            msg: "The profile must be one of the following: 'Estudante de Graduação', 'Estudante de Pós-Graduação', 'Professor', 'Profissional da Indústria'.",
          },
          notNull: {
            msg: "The 'Profile' field is required.",
          },
          notEmpty: {
            msg: "The 'Profile' field cannot be empty.",
          },
        },
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "The 'Organization' field is required.",
          },
          notEmpty: {
            msg: "The 'Organization' field cannot be empty",
          },
          is: {
            args: /^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu,
            msg: "The 'Organization' field contains invalid characters",
          },
        },
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
