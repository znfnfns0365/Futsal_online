import express from 'express';

import { signIn, signUp } from '../controllers/accountControllers.js';

const accountRouter = express.Router();

accountRouter.post('/signIn', signIn);
accountRouter.post('/signUP', signUp);

export default accountRouter;
