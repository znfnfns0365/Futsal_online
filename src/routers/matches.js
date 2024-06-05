import express from 'express';
import { recordsCheck, detailRecord } from '../controllers/match.cndtroller.js';

const matchRouter = express.Router();

matchRouter.get('/', recordsCheck);
matchRouter.get('/:director', detailRecord);

export default matchRouter;
