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

BrainstormingRoutes.get(
  "/brainstorming/statusHelp",
  BrainstormingController.helpBrainstormingStatus,
);

BrainstormingRoutes.post(
  "/brainstorming/assign-role",
  BrainstormingController.assignRole
);

BrainstormingRoutes.patch(
  "/brainstorming/:brainstormingId/checklist",
  BrainstormingController.updateBrainstormingChecklist,
);

BrainstormingRoutes.post(
  "/brainstorming/start/:brainstormingId",
  BrainstormingController.startBrainstormingSession,
);

BrainstormingRoutes.post(
  "brainstormings/:brainstormingId/user-stories/:userStoryId/cards/:cardCode/notes",
  BrainstormingController.createNote,
);

BrainstormingRoutes.put(
  "brainstormings/:brainstormingId/user-stories/:userStoryId/cards/:cardCode/notes",
  BrainstormingController.updateNote,
);

BrainstormingRoutes.get(
  "brainstormings/:brainstormingId/user-stories/:userStoryId/cards/:cardCode/notes",
  BrainstormingController.getNote,
);

BrainstormingRoutes.patch(
  "/:brainstormingId/user-stories-order",
  BrainstormingController.updateBrainstormingUserStoryOrder
);

BrainstormingRoutes.put(
  "/:id",
  BrainstormingController.updateBrainstorming
);

BrainstormingRoutes.get(
  "/:brainstormingId/export",
  BrainstormingController.exportBrainstormingResults
);

module.exports = BrainstormingRoutes;
