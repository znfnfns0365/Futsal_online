import { userPrisma, storePrisma } from '../utils/prisma/index.js';
import { playerLoad } from '../utils/coffee.js';


const playerDB = await playerLoad();
//선수 판매 기능
export const sellPlayer = async (req, res) => {
  //1.body 에서 director과 선수 id,판매하려고 하는 가격을 받아온다
  try {
    const { director, id, price } = req.body;

    //2.params기준으로 미들웨어 사용자가 감독을 보유하고 있는지, 감독이 선수 id를 보유하고 있는지 확인
    const user = req.user;
    const exsistDirector = await userPrisma.teams.findFirst({
      where: {
        director: director,
        User_id: user.user_id,
      },
    });
    if (!exsistDirector) {
      return res
        .status(403)
        .json({ errorMessage: '본인 소유의 감독이 아닙니다' });
    }
    const lockerRoom = await userPrisma.teams.findMany({
      where: {
        director: director,
      },
      select: {
        candidate_players: true,
      },
    });
    const unSaclaLockerRoom = lockerRoom[0].candidate_players;
    const exsistPlayer = unSaclaLockerRoom.find((player) => player.id == +id);
    if (!exsistPlayer) {
      return res
        .status(404)
        .json({ errorMessage: '전달받은 id를 소유한 선수를 찾을 수 없습니다' });
    }
    //3.선수 객체를 기반으로 선수의 정보를 모두 가져온다 (players db 스탯 정보 포함해서)

    const pack = playerDB.find(
      (player) => player.player_unique_id === +exsistPlayer.player_unique_id
    );
    if (!pack) {
      return res.status(500).json({
        errorMessage:
          'playerDB 관련 오류입니다. 유니크한 플레이어 정보를 가져오지 못했습니다',
      });
    }
    const storeTransactionPromise = storePrisma.$transaction(async (tx) => {
      //4.store db에 업로드 한다.
      const statJson = { fw: pack.stat_fw, mf: pack.stat_mf, df: pack.stat_df };
      const sellDB = await tx.store.create({
        data: {
          seller: director,
          name: exsistPlayer.name,
          stat: statJson,
          price: price,
          id: exsistPlayer.id,
          player_unique_id: pack.player_unique_id,
          condition: exsistPlayer.condition,
          enhance_figure: pack.enhance_figure,
        },
        select: {
          seller: true,
          name: true,
          stat: true,
          price: true,
          enhance_figure: true,
        },
      });
      return sellDB;
    });

    const userTransactionPromise = userPrisma.$transaction(async (tx) => {
      const storeTransactionResult = await storeTransactionPromise; //트랜잭션을 묶어서 처리하는 꼼수
      console.log(storeTransactionResult);

      //5.업로드 한 선수는 사용자의 계정에서 삭제한다.
      const newCandidate = unSaclaLockerRoom.filter(
        (player) => player.id != exsistPlayer.id
      );

      await tx.teams.update({
        where: {
          director: director,
        },
        data: {
          candidate_players: newCandidate,
        },
      });

      return newCandidate;
    });
    const [storeTransaction, userTransaction] = await Promise.all([
      storeTransactionPromise,
      userTransactionPromise,
    ]);

    return res.status(201).json({
      message:
        '판매 등록이 성공적으로 이루어졌습니다' +
        JSON.stringify(storeTransaction, null, 2),
    });
  } catch (error) {
    return res.status(500).json({ error: error + '--판매 트랜잭션 오류' });
  }
};

//선수 판매 취소 기능

export const cancelSell = async (req, res) => {
  const  user  = req.user;
  const { selectId, director } = req.body;
  try {
    //1. body로 입력받은 감독 정보가 미들웨어 정보와 일치하는지 확인
    const exsistDirector = await userPrisma.teams.findFirst({
      where: {
        User_id: user.user_id,
        director: director,
      },
    });
    if (!exsistDirector) {
      return res.status(404).json({ messgae: '입력한 감독을 찾지 못했습니다' });
    }
    //2. body로 입력받은 id를 기준으로 store에서 선수를 가져온다
    const player = await storePrisma.store.findFirst({
      where: {
        id: selectId,
      },
      select: {
        seller: true,
      },
    });
    if (!player) {
      return res.status(404).json({
        messgage: '해당하는 ID를 가진 선수를 상점에서 찾지 못했습니다',
      });
    }
    //3. 들고온 선수에 입력된 감독정보와 미들웨어를 통과한 유저객체의 감독정보가 일치하는지 확인
    if (player.seller != exsistDirector.director) {
      return res
        .status(403)
        .json({ message: '해당 선수에 대한 권한이 없습니다' });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: error + '--기본 검증 과정에서 오류 발생' });
  }
  //4. 트랜잭션을 이용, 해당 선수를 해당 감독에게 주고 store에서는 삭제한다
  try {
    const storeTransactionPromise = await storePrisma.$transaction(
      async (tx) => {
        const player = await tx.store.findFirst({
          //원하는 정보만 추출
          where: {
            id: selectId,
          },
          select: {
            id: true,
            name: true,
            condition: true,
            player_unique_id: true,
          },
        });
        await tx.store.delete({
          //추출 했으면 삭제
          where: {
            id: selectId,
          },
        });
        return player;
      }
    );
    //4-1 팀정보의 candidate_players에 데이터를 넣을 수 있도록 준비한다.
    const userTransactionPromise = await userPrisma.$transaction(async (tx) => {
      const storeTransactionResult = storeTransactionPromise;
      const lockerRoom = await tx.teams.findMany({
        where: {
          director: director,
        },
        select: {
          candidate_players: true,
        },
      });
      const unSaclaLockerRoom = lockerRoom[0].candidate_players; //기존 보유중인 선수목록을 배열로 준비

      //4-2 상점 판매 정보에서 필요한 데이터를 긁어와 객체로 만들어 candidate_players에 넣은후 update해준다
      unSaclaLockerRoom.push(storeTransactionResult);
      await tx.teams.update({
        where: {
          director: director,
        },
        data: {
          candidate_players: unSaclaLockerRoom,
        },
      });
      return storeTransactionResult
    });

    return res
      .status(201)
      .json({ messgae: '선수 판매 취소가 완료 되었습니다'+JSON.stringify(userTransactionPromise,null,2)});
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: error + '--트랜잭션 과정에서 오류 발생' });
  }
};
