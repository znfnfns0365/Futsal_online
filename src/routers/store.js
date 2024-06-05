import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { gacha } from '../controllers/player.controller.js';
import { sellPlayer } from '../controllers/store.controller.js';
const storeRouter = express.Router();

// /api/store/ 에 대한 라우터들을 정의

storeRouter.post('/gacha/:director', authMiddleware, gacha);
storeRouter.post('/sell',authMiddleware,sellPlayer);
export default storeRouter;
