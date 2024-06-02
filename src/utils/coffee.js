//파일 이름을 정하지 못해서 커피로 했습니다. 여기에는 자주 사용하는 함수를 작성하면 됩니다
import {userPrisma,playerPrisma,matchPrisma} from "../utils/prisma/index.js"
import bcrypt from "bcrypt";



/**
 * user_id를 전달하면 해당 유저가 있을 경우 그 user 객체를 통째로 반환합니다. 없을 경우 throw error을 반환합니다.
 * @param {string} user_id - 찾고자 하는 사용자의 user_id
 * @returns {Promise<Object>} - 해당 user_id에 대응되는 사용자 객체
 * @throws {Error} - 해당 user_id에 대응되는 사용자를 찾을 수 없는 경우
 */
export async function findAccount(user_id) {
    try {
      const user = await userPrisma.accounts.findFirst({
        where: {
          user_id: user_id,
        },
      });
      if (!user) throw new Error('해당 아이디로 가입된 계정을 찾을 수 없습니다');
      return user;
    } catch (error) {
      throw new Error(error.message); // findAccount 오류를 상위 함수로 다시 던집니다.
    }
  }

/**
 * findAccount로 찾은 user 객체 자체와 클라이언트가 보내준 password를 넣으면 자동으로 에러를 반환합니다.
 * @param {Object} user - findAccount 함수로부터 반환된 사용자 객체
 * @param {string} password - 사용자가 제공한 비밀번호
 * @throws {Error} - 비밀번호를 입력하지 않은 경우 또는 비밀번호가 일치하지 않는 경우
 */
export async function checkPassword(user, password) {
    if (!password) {
      throw new Error('비밀번호를 입력하지 않았습니다');
    }
    try {
      // 주어진 비밀번호와 사용자의 해시된 비밀번호를 비교
      const check = await bcrypt.compare(password, user.password);
      if(!check){
        throw new Error("비밀번호가 일치하지 않습니다");
      }
    } catch (error) {
      throw new Error(error.message); // checkPassword 오류! 상위 함수로 다시 던집니다.
    }
  }