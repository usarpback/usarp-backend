const { Sequelize } = require("sequelize");
const { ValidationError } = require("sequelize");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Brainstormings = require("../models/brainstorming.model");
// const UserStories = require("../models/userStories.model");
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

      const creator = await User.findOne({
        where: { id: creatorId },
        attributes: ["id", "fullName", "email", "organization"],
      });

      if (!creator) {
        await t.rollback();
        return response.status(400).json({
          message: `Creator with id '${creatorId}' not found.`,
        });
      }

      const teamMembers = [];

      let creatorAdded = false;

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
          {
            projectId: project.id,
            memberId: user.id,
            fullName: user.fullName,
            memberEmail: email,
            roleInProject,
          },
          { transaction: t },
        );

        teamMembers.push({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleInProject,
        });

        if (email === creator.email) {
          creatorAdded = true;
        }
      }

      if (!creatorAdded) {
        await ProjectUser.create(
          {
            projectId: project.id,
            memberId: creator.id,
            fullName: creator.fullName,
            memberEmail: creator.email,
            roleInProject: "Moderador",
          },
          { transaction: t },
        );
        teamMembers.push({
          id: creator.id,
          fullName: creator.fullName,
          email: creator.email,
          roleInProject: "Moderador",
        });
      }

      await t.commit();

      const projectResponse = project.toJSON();
      delete projectResponse.creatorId;

      return response.status(201).json({
        project: projectResponse,
        creator: creator.toJSON(),
        projectTeam: teamMembers,
      });
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

  async getAllUserCreatedProjectsAndCounts(request, response) {
    try {
      const projects = await Project.findAndCountAll({
        where: {
          creatorId: request.userId,
        },
      });

      if (projects.count === 0) {
        return response
          .status(404)
          .json({ message: "No user-created projects yet" });
      }

      const formattedProjects = await Promise.all(
        projects.rows.map(async (project) => {
          const projectData = project.toJSON();

          const creator = await User.findOne({
            where: { id: project.creatorId },
            attributes: ["id", "fullName", "email", "organization"],
          });

          if (!creator) {
            throw new Error(
              `Creator with id '${project.creatorId}' not found.`,
            );
          }

          projectData.creator = creator.toJSON();

          const projectUsers = await ProjectUser.findAll({
            where: { projectId: project.id },
            attributes: [
              "memberId",
              "fullName",
              "memberEmail",
              "roleInProject",
            ],
          });

          projectData.projectTeam = projectUsers.map((member) => ({
            memberId: member.memberId,
            fullName: member.fullName,
            email: member.memberEmail,
            roleInProject: member.roleInProject,
          }));

          const { creatorId, ...projectWithoutCreatorId } = projectData;

          return projectWithoutCreatorId;
        }),
      );

      return response.status(200).json({
        count: projects.count,
        projects: formattedProjects,
      });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async getProjectsDetails(request, response) {
    try {
      const userEmail = request.userEmail;

      const projectMemberships = await ProjectUser.findAll({
        where: { memberEmail: userEmail },
        attributes: ["projectId"],
      });

      const projectIds = projectMemberships.map(
        (membership) => membership.projectId,
      );

      const projects = await Project.findAll({
        where: { id: projectIds },
      });

      const formattedProjects = await Promise.all(
        projects.map(async (project) => {
          const projectData = project.toJSON();

          const creator = await User.findOne({
            where: { id: project.creatorId },
            attributes: ["id", "fullName", "email", "organization"],
          });

          if (!creator) {
            throw new Error(
              `Creator with id '${project.creatorId}' not found.`,
            );
          }

          const brainstormings = await Brainstormings.findAndCountAll({
            where: { project: project.id },
          });

          const projectUsers = await ProjectUser.findAll({
            where: { projectId: project.id },
            attributes: [
              "memberId",
              "fullName",
              "memberEmail",
              "roleInProject",
            ],
          });

          projectData.creator = creator.toJSON();
          projectData.projectTeam = projectUsers.map((member) => ({
            memberId: member.memberId,
            fullName: member.fullName,
            email: member.memberEmail,
            roleInProject: member.roleInProject,
          }));

          projectData.brainstormingsCount = brainstormings.count;

          const { creatorId, ...projectWithoutCreatorId } = projectData;

          return projectWithoutCreatorId;
        }),
      );

      return response.status(200).json({
        projects: formattedProjects,
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
