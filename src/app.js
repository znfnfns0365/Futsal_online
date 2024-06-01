import express from 'express';
//import cookieParser from 'cookie-parser';
import usersRouter from './routes/users.router.js';
// import errorHandlingMiddlewares from './middlewares/error-handling.middlewares.js';

const app = express();
const PORT = 3001;

app.use(express.json());
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/api', [usersRouter]);
// app.use(errorHandlingMiddlewares);

app.listen(PORT, () => {
  console.log('서버가 3001 포트에서 열렸습니다');
});
