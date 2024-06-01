import express from "express";

import { signIn } from "../controllers/accountControllers";

const accountRouter = express.Router();

accountRouter.get('/',signIn);


export default accountRouter;