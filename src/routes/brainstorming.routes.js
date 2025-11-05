const express = require("express");
const BrainstormingRoutes = express.Router();
const BrainstormingController = require("../controllers/brainstorming.controller");

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

module.exports = BrainstormingRoutes;
