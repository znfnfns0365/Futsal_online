import express from 'express';
//import cookieParser from 'cookie-parser';
//import errorHandlingMiddlewares from './middlewares/error-handling.middlewares.js';
import accountRouter from './routers/accounts.js';
import directorRouter from './routers/directors.js';
import kickoffRouter from './routers/kickoff.js';
import playersRouter from './routers/players.js';
import storeRouter from './routers/store.js';
import matchRouter from './routers/matches.js';

const app = express();
const PORT = 3001;

app.use(express.json());
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
//app.use('/api', [accountRouter]);
app.use('/api/account', accountRouter);
app.use('/api/director', directorRouter);
app.use('/api/kickoff', kickoffRouter);
app.use('/api/player', playersRouter);
app.use('/api/store', storeRouter);
app.use('/api/matches', matchRouter);


app.listen(PORT, () => {
    console.log('서버가 3001 포트에서 열렸습니다');
});
