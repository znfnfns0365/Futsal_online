라우팅 경로와 http 메서드를 정하는 파일입니다

```
import {createAccount , deleteAccount , login} from "../controllers/accountControllers.js";

const accountRouter = express.Router();

accountRouter.post("/",createAccount);
accountRouter.delete("/",deleteAccount);
accountRouter.get("/",login);


export default accountRouter;
```
