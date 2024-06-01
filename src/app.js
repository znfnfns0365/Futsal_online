import express from 'express';
//import cookieParser from 'cookie-parser';
import usersRouter from './routes/users.router.js';
import errorHandlingMiddlewares from './middlewares/error-handling.middlewares.js';

const app = express();
const PORT = 3001;

app.use(express.json());
<<<<<<< HEAD
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/api', [usersRouter]);
app.use(errorHandlingMiddlewares);
=======
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
>>>>>>> ba2ad67202419fd7701f01accee33797036aa70f

app.listen(PORT, () => {
  console.log('서버가 3001 포트에서 열렸습니다');
});
