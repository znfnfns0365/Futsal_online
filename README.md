# Team_Project_3
풋살 온라인 프로젝트


controllers폴더 : 로직을 실질적으로 구현
    ex:
        accountControllers.js
            export const createAccount = async (req, res) => {
                    const { accountName, password, passwordCheck }
                    -- 로직 구현-- 
            }
        playerControllers.js
        itemControllers.js

middleware 폴더: 미들웨어의 구현
    ex:
        auth.middleware.js
        log.middleware.js


routers 폴더: http 요청 메서드
    ex:
        account.js
            import {createAccount , deleteAccount , login} from "../controllers/accountControllers.js";

                const accountRouter = express.Router();

                accountRouter.post("/",createAccount);
                accountRouter.delete("/",deleteAccount);
                accountRouter.get("/",login);
                export default accountRouter;
                
        player.js