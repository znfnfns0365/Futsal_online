import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  checkDirectorTeam,
  changeTeamPlayer,
} from '../controllers/squad.controller.js';

const squadRouter = express.Router();

squadRouter.get('/:director', checkDirectorTeam);
squadRouter.patch('/change/:director', authMiddleware, changeTeamPlayer);

export default squadRouter;
