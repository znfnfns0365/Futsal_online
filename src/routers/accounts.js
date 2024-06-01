import express from "express";

import { signIn,signUp } from "../controllers/accountControllers.js";

const accountRouter = express.Router();

accountRouter.get('/',signIn);
accountRouter.post('/',signUp);

export default accountRouter;