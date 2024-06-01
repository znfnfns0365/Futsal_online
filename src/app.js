import express from 'express';
//import cookieParser from 'cookie-parser';
//import errorHandlingMiddlewares from './middlewares/error-handling.middlewares.js';
import accountRouter from './routers/accounts.js'

const app = express();
const PORT = 3001;

app.use(express.json());
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
//app.use('/api', [accountRouter]);
app.use('/api/account', accountRouter);

app.listen(PORT, () => {
  console.log('서버가 3001 포트에서 열렸습니다');
});
