const express = require("express");
const BrainstormingRoutes = express.Router();
const BrainstormingController = require("../controllers/brainstorming.controller");
const brainstormingController = require("../controllers/brainstorming.controller");

BrainstormingRoutes.post(
  "/brainstorming/create",
  BrainstormingController.createBrainstorming,
);

BrainstormingRoutes.get(
  "/brainstorming/countAllBrainstormings",
  BrainstormingController.getAllBrainstormingsAndCount,
);

BrainstormingRoutes.get(
  "/brainstorming/getAllUserBrainstormingsGrid/:id",
  BrainstormingController.getAllUserBrainstormingsGrid,
);

BrainstormingRoutes.get(
  "/brainstorming/getAllUserBrainstormingsList/:id",
  BrainstormingController.getAllUserBrainstormingsList,
);

BrainstormingRoutes.patch(
  "/brainstorming/:brainstormingId/status",
  BrainstormingController.updateBrainstormingStatus,
);

BrainstormingRoutes.delete(
  "/brainstorming/:brainstormingId",
  BrainstormingController.deleteBrainstorming,
);

BrainstormingRoutes.get(
  "/brainstorming/statusHelp",
  BrainstormingController.helpBrainstormingStatus,
);

BrainstormingRoutes.post(
  "/brainstorming/assign-role",
  BrainstormingController.assignRole
);

module.exports = BrainstormingRoutes;
