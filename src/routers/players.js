import express from 'express';

import { playerInventory, gacha, myPlayerInfo, releasePlayer } from '../controllers/player.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const playerRouter = express.Router();

playerRouter.get('/:director', playerInventory);
playerRouter.get('/:director/:player_unique_id', myPlayerInfo);
playerRouter.patch('/:director', authMiddleware, releasePlayer);

export default playerRouter;
