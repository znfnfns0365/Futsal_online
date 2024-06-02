import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  createDirector,
  checkDirector,
  checkDirectorDetail,
  deleteDirector,
  updateDirector,
} from '../controllers/director.controller.js';

const directorRouter = express.Router();

directorRouter.post('/', authMiddleware, createDirector);
directorRouter.get('/', authMiddleware, checkDirector);
directorRouter.get('/:director', authMiddleware, checkDirectorDetail);
directorRouter.delete('/:director', authMiddleware, deleteDirector);
directorRouter.patch('/:director', authMiddleware, updateDirector);

export default directorRouter;
