import express from 'express';

import {
    playerInventory,
    myPlayerInfo,
    playerUpgrade,
} from '../controllers/player.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const playerRouter = express.Router();

playerRouter.get('/:director', playerInventory);
playerRouter.get('/:director/:player_unique_id', myPlayerInfo);
playerRouter.patch('/:director/upgrade', authMiddleware, playerUpgrade);
//accountRouter.post('/:director/gacha', gacha);

export default playerRouter;
