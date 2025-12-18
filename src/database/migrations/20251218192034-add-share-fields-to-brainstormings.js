'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("brainstormings", "share_token", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("brainstormings", "share_role_on_access", {
      type: Sequelize.ENUM("Moderador", "Participante"),
      allowNull: false,
      defaultValue: "Participante",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("brainstormings", "share_role_on_access");
    await queryInterface.removeColumn("brainstormings", "share_token");

    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        "DROP TYPE IF EXISTS \"enum_brainstormings_share_role_on_access\";"
      );
    }
  },
};
