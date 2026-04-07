"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brainstorming_user_roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      brainstormingId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('Moderador', 'Participante'),
        allowNull: false
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('brainstorming_user_roles');
  }
};
