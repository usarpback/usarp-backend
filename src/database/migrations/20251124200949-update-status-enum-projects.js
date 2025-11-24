'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona uma coluna temporária para armazenar valores atuais
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ADD COLUMN status_tmp TEXT;
    `);

    // Copia os valores existentes para a coluna temporária
    await queryInterface.sequelize.query(`
      UPDATE "projects" SET status_tmp = status::text;
    `);

    // Remove o default para permitir alteração do tipo da coluna
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ALTER COLUMN status DROP DEFAULT;
    `);

    // Renomeia o enum antigo para liberar o nome
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_projects_status" RENAME TO "enum_projects_status_old";
    `);

    // Cria o novo enum com os valores atualizados
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_projects_status" AS ENUM ('Ativo', 'Bloqueado', 'Concluído/Encerrado');
    `);

    // Altera a coluna para o novo enum, inicializando dados com NULL para evitar conflito
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects"
      ALTER COLUMN status TYPE "enum_projects_status"
      USING NULL;
    `);

    // Atualiza o status com cast explícito, a partir dos dados temporários
    await queryInterface.sequelize.query(`
      UPDATE "projects" SET status = CASE
        WHEN status_tmp = 'Novo' THEN 'Ativo'::enum_projects_status
        WHEN status_tmp = 'Excluído' THEN 'Bloqueado'::enum_projects_status
        WHEN status_tmp = 'Mais antigo' THEN 'Concluído/Encerrado'::enum_projects_status
        ELSE NULL
      END;
    `);

    // Define o novo default
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ALTER COLUMN status SET DEFAULT 'Ativo';
    `);

    // Remove a coluna temporária
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" DROP COLUMN status_tmp;
    `);

    // Remove o enum antigo, se existir (DROP TYPE com IF EXISTS para evitar erro)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_projects_status_old";
    `);
  },

  async down(queryInterface, Sequelize) {
    // Recria o enum antigo
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_projects_status_old" AS ENUM ('Novo', 'Excluído', 'Mais antigo');
    `);

    // Adiciona a coluna temporária para guardar o status atual
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ADD COLUMN status_tmp TEXT;
    `);

    // Copia os valores atuais da coluna status
    await queryInterface.sequelize.query(`
      UPDATE "projects" SET status_tmp = status::text;
    `);

    // Remove o default para poder alterar o tipo da coluna
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ALTER COLUMN status DROP DEFAULT;
    `);

    // Altera a coluna para o enum antigo
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects"
      ALTER COLUMN status TYPE "enum_projects_status_old"
      USING NULL;
    `);

    // Atualiza os dados usando a coluna temporária
    await queryInterface.sequelize.query(`
      UPDATE "projects" SET status = CASE
        WHEN status_tmp = 'Ativo' THEN 'Novo'::enum_projects_status_old
        WHEN status_tmp = 'Bloqueado' THEN 'Excluído'::enum_projects_status_old
        WHEN status_tmp = 'Concluído/Encerrado' THEN 'Mais antigo'::enum_projects_status_old
        ELSE NULL
      END;
    `);

    // Redefine o default antigo
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" ALTER COLUMN status SET DEFAULT 'Novo';
    `);

    // Remove a coluna temporária
    await queryInterface.sequelize.query(`
      ALTER TABLE "projects" DROP COLUMN status_tmp;
    `);

    // Remove o enum novo
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_projects_status";
    `);

    // Restaura o nome do enum antigo para o original
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_projects_status_old" RENAME TO "enum_projects_status";
    `);
  }
};
