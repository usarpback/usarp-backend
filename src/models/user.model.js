const { Model, DataTypes } = require("sequelize");
const { compare,hash } = require("bcrypt");
const tokenHelper = require("../helpers/token.helpers");

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        fullname: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The full name field cannot be empty",
            },
            notEmpty: {
              msg: "The full name field cannot be empty",
            },
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            msg: "The email is already in use",
          },
          validate: {
            notNull: {
              msg: "The email field cannot be empty",
            },
            notEmpty: {
              msg: "The email field cannot be empty",
            },
            isEmail: {
              msg: "The email is invalid",
            },
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The password field cannot be empty",
            },
            notEmpty: {
              msg: "The password field cannot be empty",
            },
            isStrongPassword(value) {
              if (
                !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}/.test(
                  value
                )
              ) {
                throw new Error(
                  "The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character."
                );
              }
            },
          },
        },
        gender: {
          type: DataTypes.ENUM("male", "female", "not_specified"),
          allowNull: false,
          defaultValue: "not_specified", // Define um valor padrão
        },
        birthdate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The birth date field cannot be empty",
            },
            notEmpty: {
              msg: "The birth date field cannot be empty",
            },
          },
        },
        profile: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        organization: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "users",
        paranoid: false,
        hooks: {
          beforeCreate: async (user) => {
            const hashedPassword = await hash(user.password, 10);
            user.password = hashedPassword;
          },
          beforeUpdate: async (user) => {
            const hashedPassword = await hash(user.password, 10);
            user.password = hashedPassword;
          },
        },
      },
    );
  }

  validatePassword(password) {
    return compare(password, this.password);
  }

  generateToken(expiresIn = "4h") {
    const data = { id: this.id, email: this.email, fullname: this.fullname };
    return tokenHelper.generateToken(data, expiresIn);
  }
}

module.exports = User;
