import express from 'express';

import { playerInventory } from '../controllers/player.controller.js';

const accountRouter = express.Router();

accountRouter.get('/:director', playerInventory);

export default accountRouter;
