const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const datefns = require("date-fns");
const tokenHelper = require("../helpers/token.helpers");

class User extends Model {
  static associate(models) {
    this.belongsToMany(models.Project, {
      through: "ProjectUser",
      foreignKey: "memberEmail",
      as: "projects",
    });
  }
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          unique: true,
        },
        fullName: {
          type: DataTypes.STRING,
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
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            msg: "The email is already in use",
          },
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
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'password' field is required.",
            },
            notEmpty: {
              msg: "The 'password' field cannot be empty",
            },
            isStrongPassword(value) {
              if (
                !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>~|/\\])(?!\s){8,15}/.test(
                  value,
                )
              ) {
                throw new Error(
                  "The password must be at least 8 and at most 15 characters long and contain at least one lowercase letter, one uppercase letter, one number, one special character and no spaces.",
                );
              }
            },
          },
        },
        gender: {
          type: DataTypes.ENUM(
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
                [
                  "Feminino",
                  "Masculino",
                  "Não binário",
                  "Prefiro não informar",
                ],
              ],
              msg: "Gender must be 'Feminino', 'Masculino', 'Não binário', or 'Prefiro não informar'.",
            },
            notNull: {
              msg: "The 'gender' field is required.",
            },
            notEmpty: {
              msg: "The 'gender' field cannot be empty.",
            },
          },
        },
        birthdate: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'birth date' field is required.",
            },
            notEmpty: {
              msg: "The 'birth date' field cannot be empty",
            },
            isValidDate(value) {
              const parsedDate = datefns.parse(value, "dd/MM/yyyy", new Date());
              if (
                !datefns.isValid(parsedDate) ||
                datefns.format(parsedDate, "dd/MM/yyyy") !== value
              ) {
                throw new Error(
                  "The 'birth date' field must be a valid date and in the format DD/MM/AAAA.",
                );
              }
            },
          },
        },
        profile: {
          type: DataTypes.ENUM(
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
          type: DataTypes.STRING,
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
        loginAttempts: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        lockUntil: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        resetPasswordToken: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        resetPasswordExpires: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "Users",
        tableName: "users",
        hooks: {
          beforeCreate: async (user) => {
            if (user.changed("password")) {
              const hashedPassword = await bcrypt.hash(user.password, 10);
              user.password = hashedPassword;
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed("password")) {
              const hashedPassword = await bcrypt.hash(user.password, 10);
              user.password = hashedPassword;
            }
          },
        },
      },
    );
  }

  validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  generateToken(expiresIn = "5d") {
    const data = { id: this.id, email: this.email, fullName: this.fullName };
    return tokenHelper.generateToken(data, expiresIn);
  }
}

module.exports = User;
