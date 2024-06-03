미들웨어 처리 폴더 입니다

ex

```
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // 로그 레벨을 'info'로 설정합니다.
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // 로그를 콘솔에 출력합니다.
  ],
});

export const requestLogger = (req, res, next) => {
  // 클라이언트의 요청이 시작된 시간을 기록합니다.
  const start = new Date().getTime();

  // 응답이 완료되면 로그를 기록합니다.
  res.on('finish', () => {
    const duration = new Date().getTime() - start;
    logger.info({
      message: 'Request log',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: 'Error log',
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ errorMessage: '서버 에러가 발생했습니다.' });
};

```
