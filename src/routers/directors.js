import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
    createDirector,
    checkDirector,
    checkDirectorDetail,
    deleteDirector,
    updateDirector,
    cashCarge,
    checkDirectorTeam,
    changeTeamPlayer,
} from '../controllers/director.controller.js';

const directorRouter = express.Router();

directorRouter.post('/', authMiddleware, createDirector);
directorRouter.get('/', authMiddleware, checkDirector);
directorRouter.get('/:director', authMiddleware, checkDirectorDetail);
directorRouter.get('/squad/:director', checkDirectorTeam);
directorRouter.patch(
    '/squad/change/:director',
    authMiddleware,
    changeTeamPlayer
);
directorRouter.delete('/:director', authMiddleware, deleteDirector);
directorRouter.patch('/:director', authMiddleware, updateDirector);
directorRouter.post('/:director/cash', authMiddleware, cashCarge);

export default directorRouter;
