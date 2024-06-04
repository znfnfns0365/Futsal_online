import express from 'express';
import { playerInventory, myPlayerInfo, playerUpgrade, releasePlayer } from '../controllers/player.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const playerRouter = express.Router();

playerRouter.get('/:director', playerInventory);
playerRouter.get('/:director/:player_unique_id', myPlayerInfo);
playerRouter.patch('/:director', authMiddleware, releasePlayer);
playerRouter.patch('/:director/upgrade', authMiddleware, playerUpgrade);


export default playerRouter;
