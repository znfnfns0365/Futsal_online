import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  createDirector,
  checkDirector,
  checkDirectorDetail,
  deleteDirector,
  updateDirector,
  cashCarge,
  ranking,
} from '../controllers/director.controller.js';

const directorRouter = express.Router();

directorRouter.post('/', authMiddleware, createDirector);
directorRouter.get('/', authMiddleware, checkDirector);
directorRouter.get('/ranking', ranking);
directorRouter.get('/:director', authMiddleware, checkDirectorDetail);
directorRouter.delete('/:director', authMiddleware, deleteDirector);
directorRouter.patch('/:director', authMiddleware, updateDirector);
directorRouter.post('/:director/cash', authMiddleware, cashCarge);

export default directorRouter;
