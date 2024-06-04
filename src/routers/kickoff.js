import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  kickoff,
  automaticKickoff,
} from '../controllers/kickoff.controller.js';

const kickoffRouter = express.Router();

kickoffRouter.post('/:director/', authMiddleware, automaticKickoff);
kickoffRouter.post('/:director/:opposingDirector', authMiddleware, kickoff);

export default kickoffRouter;
