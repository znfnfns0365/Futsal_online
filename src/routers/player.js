import express from 'express';

import { playerInventory, gacha, myPlayerInfo } from '../controllers/player.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const accountRouter = express.Router();

accountRouter.get('/:player_unique_id', myPlayerInfo);
accountRouter.get('/:director', playerInventory);
//accountRouter.post('/:director/gacha', gacha);

export default accountRouter;
