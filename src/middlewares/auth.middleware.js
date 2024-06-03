import jwt from 'jsonwebtoken';
import { userPrisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    const [tokenType, token] = authorization.split(' ');

    if (tokenType !== 'Bearer')
      throw new Error('토큰 타입이 일치하지 않습니다.');
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decodedToken.user_id;

    if (!user_id) {
      throw new Error('로그인 정보가 필요합니다.');
    }

    const user = await userPrisma.accounts.findFirst({
      where: { user_id },
    });

    if (!user) throw new Error('토큰 사용자가 존재하지 않습니다.');

    req.user = user;
    console.log(user);

    next();
  } catch (error) {
    res.clearCookie('authorization');
    switch (error.name) {
      case 'TokenExpiredError': // 토큰이 만료되었을 때 발생하는 에러
        return res.status(401).json({ errorMessage: '토큰이 만료되었습니다.' });
      case 'JsonWebTokenError': // 토큰 검증이 실패했을 때, 발생하는 에러
        return res
          .status(401)
          .json({ errorMessage: '토큰 인증에 실패하였습니다.' });
      default:
        return res.status(401).json({
          errorMessage: error.errorMessage ?? '비 정상적인 요청입니다.',
        });
    }
  }
}

// const authMiddleware = require("./middleware/auth.middleware");
