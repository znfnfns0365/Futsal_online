import express from 'express';

import { playerInventory, gacha, myPlayerInfo, releasePlayer } from '../controllers/player.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const playerRouter = express.Router();

playerRouter.get('/:director', playerInventory);
playerRouter.get('/:director/:player_unique_id', myPlayerInfo);
playerRouter.delete('/:director/:player_unique_id', authMiddleware, releasePlayer);
playerRouter.patch('/gacha', gacha);

export default playerRouter;
