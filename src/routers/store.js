import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { gacha } from '../controllers/player.controller.js';

const storeRouter = express.Router();

// /api/store/ 에 대한 라우터들을 정의

<<<<<<< HEAD
storeRouter.get('/gacha/:director', authMiddleware, gacha);
=======
storeRouter.post('/gacha/:director',authMiddleware,gacha);
>>>>>>> 74391e6bdca8b6ecb137b1361e284cffaff48d45

export default storeRouter;
