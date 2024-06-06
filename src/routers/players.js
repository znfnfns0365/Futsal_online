import express from 'express';
import {
  playerInventory,
  myPlayerInfo,
  playerUpgrade,
  releasePlayer,
  canUpgrade,
} from '../controllers/player.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const playerRouter = express.Router();

playerRouter.get('/:director', playerInventory);
playerRouter.get('/upgrade/:director', authMiddleware, canUpgrade);
playerRouter.get('/:director/:player_unique_id', myPlayerInfo);
playerRouter.patch('/upgrade/:director', authMiddleware, playerUpgrade);
playerRouter.patch('/:director', authMiddleware, releasePlayer);

export default playerRouter;
