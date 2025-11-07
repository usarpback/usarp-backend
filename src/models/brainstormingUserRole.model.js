const { Model, DataTypes } = require("sequelize");

class BrainstormingUserRole extends Model {
    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'userId'
        });

        this.belongsTo(models.Brainstorming, {
            foreignKey: 'brainstormingId'
        });
    }

    static init(sequelize){
        super.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                },
                brainstormingId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                },
                roleInBrainstorming: {
                    type: DataTypes.ENUM('Moderador', 'Participante'),
                    allowNull: false,
                }
            },
            {
                sequelize,
                modelName: 'BrainstormingUserRole',
                tableName: 'brainstorming_user_roles',
                timestamps: false,
            }
        );
    }
}

module.exports = BrainstormingUserRole;