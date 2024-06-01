import express from 'express';
import bcrypt from 'bcrypt';
import { userPrisma } from '../utils/prisma/index.js';
import joi from 'joi';

const router = express.Router();

const passwordSchema = joi
  .string()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{8,20}$')) // 영문자와 숫자를 포함하며, 길이는 8~20자
  .required();

//회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    //    //1. id password name body로 전달
    const { user_id, password1, password2, name } = req.body;

    //id는 unique값을 할당 따로 여기서 유효성 검증할 필요가 없긴 함
    //하지만 오류 메세지가 나오는데 이 걸 switch문에 해당 에러를 케이스로 넣어서 클라이언트에 반환해야함

    //비밀번호 유효성 검사는 소문자&숫자만 쓸수 있는 제한이 있습니다
    //비밀번호 확인 값과 비밀번호가 다르면 오류가 발생해야 합니다

    //password1 validation

    //2. 동일한 id을 가진 사용자가 있는지 확인
    const isExistUser = await userPrisma.accounts.findFirst({
      where: { user_id },
    });
    if (isExistUser) {
      return res
        .status(409)
        .json({ errorMessage: '이미 존재하는 아이디 입니다.' });
    }

    const { error } = passwordSchema.validate(password1);
    if (error) {
      return res
        .status(400)
        .json({ errorMessage: '소문자 숫자로만 구성해주세요' });
    }

    //비밀번호와 비밀번호 확인값이 동일해야 회원가입이 되어야 함
    if (password1 !== password2) {
      return res
        .status(400)
        .json({ errMessage: '비밀번호가 일치하지 않습니다' });
    }
    //2. users 테이블에 id,password name이 들어간 데이터 생성
    //비밀번호 hash
    const hashedPassword = await bcrypt.hash(password1, 10);

    //데이터베이스에 생성
    const createAccount = await userPrisma.accounts.create({
      data: {
        user_id,
        password: hashedPassword,
        name,
      },
      select: {
        user_id: true,
        name: true,
        created_at: true,
      },
    });

    //3. 클라이언트 반환
    return res.status(200).json({ data: createAccount });
  } catch (err) {
    return res.status(400).json({errorMessage:err.message});
  }
});

export default router;
