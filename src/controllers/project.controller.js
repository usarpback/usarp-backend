const { Sequelize } = require("sequelize");
const { ValidationError } = require("sequelize");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const ProjectUser = require("../models/projectUser.model");
const sequelize = require("../database/index");

module.exports = {
  async createProject(request, response) {
    const { projectName, description, projectTeam } = request.body;
    const creatorId = request.userId;

    const t = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const project = await Project.create(
        { projectName, description, creatorId },
        { transaction: t },
      );
      const teamMembers = [];

      for (const member of projectTeam) {
        const { email, roleInProject } = member;

        const user = await User.findOne({ where: { email } });

        if (!user) {
          await t.rollback();
          return response.status(400).json({
            message: `User with email '${email}' not found.`,
          });
        }

        const existingMember = await ProjectUser.findOne({
          where: { memberEmail: email, projectId: project.id },
          transaction: t,
        });

        if (existingMember) {
          await t.rollback();
          return response.status(400).json({
            message: `Email address '${email}' has already been invited to the project. Please enter a different email.`,
          });
        }

        await ProjectUser.create(
          { projectId: project.id, memberEmail: email, roleInProject },
          { transaction: t },
        );

        teamMembers.push({ email, roleInProject });
      }

      await t.commit();

      return response.status(201).json({ project, projectTeam: teamMembers });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }

      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      }
      return response.status(500).json({ message: error.message });
    }
  },

  async getAllUserCreatedProjects(request, response) {
    try {
      const getAllUserCreatedProjects = await Project.findAll({
        where: {
          creatorId: request.userId,
        },
      });

      if (getAllUserCreatedProjects.length === 0) {
        return response
          .status(404)
          .json({ message: "No user-created projects yet" });
      }

      return response.status(200).json({ getAllUserCreatedProjects });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
