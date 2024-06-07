import {
  userPrisma,
  storePrisma,
  playerPrisma,
} from '../utils/prisma/index.js';
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
      message: '판매 등록이 성공적으로 이루어졌습니다',
      '판매 정보': storeTransaction,
    });
  } catch (error) {
    return res.status(500).json({ error: error + '--판매 트랜잭션 오류' });
  }
};

//이적시장 매물 조회 API
export const storeList = async (req, res, next) => {
  const allList = await storePrisma.store.findMany({
    select: {
      player_unique_id: true,
      id: true,
      name: true,
      price: true,
      stat: true,
      enhance_figure: true,
    },
  });
  return res.status(200).json(allList);
};

//선수 구매 API
export const buyPlayer = async (req, res, next) => {
  try {
    //1. 팀의 감독과 사려고하는 선수의 id를 body로 전달
    const { director, id } = req.body;

    //2. params기준으로 미들웨어 사용자가 감독을 보유하고 있는지
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
    //3. 감독 검증이 완료됐으면 전달받은 id를 바탕으로 이적시장 매물이 있는지 찾는다.
    const addPlayer = await storePrisma.store.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        condition: true,
        player_unique_id: true,
      },
    });

    const findPlayer = await storePrisma.store.findFirst({
      where: {
        id,
      },
    });
    //시장에 id같은 매물이 없다면
    if (findPlayer === null) {
      return res
        .status(405)
        .json({ message: '구입하려는 선수가 존재하지 않습니다' });
    }
    //내 돈 불러오기
    const myMoney = await userPrisma.budget.findFirst({
      where: {
        Director: director,
      },
    });
    if (myMoney.money < findPlayer.price) {
      return res.status(405).json({ message: '잔액이 부족합니다' });
    }

    //매물이 있고 잔액도 충분하다면
    //1.내 캐시 출금 2.상대 캐시 입금 3.이적시장 테이블 삭제
    //4. 감독 candidate_player에 해당 선수 추가 트랜잭션 사용해야함
    let seller;
    const buyPlayerTransactionPromise = storePrisma.$transaction(async (tx) => {
      // 해당 선수 테이블 삭제
      const deletePlayerList = await tx.store.delete({
        where: {
          id,
        },
      });
      return deletePlayerList;
    });

    const withdrawDepositPromise = userPrisma.$transaction(async (tx) => {
      const storeTransactionResult = await buyPlayerTransactionPromise; //트랜잭션을 묶어서 처리하는 꼼수
      console.log(storeTransactionResult);
      //내 계좌 출금
      const withdraw = await tx.budget.update({
        where: {
          Director: director,
        },
        data: {
          money: { decrement: findPlayer.price },
        },
      });

      //판매자 계좌 입금
      await tx.budget.update({
        where: {
          Director: findPlayer.seller,
        },
        data: {
          money: {
            increment: findPlayer.price * 0.9,
          },
        },
      });

      const pushPlayer = await tx.teams.findFirst({
        where: {
          director,
        },
        select: {
          candidate_players: true,
        },
      });
      pushPlayer.candidate_players.push(addPlayer);

      //구매자 candidate_player에 추가
      await tx.teams.update({
        where: {
          director,
        },
        data: {
          candidate_players: pushPlayer.candidate_players,
        },
      });

      return withdraw;
    });

    const [storeTransaction, userTransaction] = await Promise.all([
      buyPlayerTransactionPromise,
      withdrawDepositPromise,
    ]);
    addSalesRecoreds(findPlayer); //판매완료된 선수는 기록에 남는다
    return res.status(200).json({ message: '구매완료', findPlayer });
  } catch (err) {
    return res.status(408).json({ errorMessage: err.message });
  }
};

//선수 판매 취소 기능

export const cancelSell = async (req, res) => {
  const user = req.user;
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
      return storeTransactionResult;
    });

    return res.status(201).json({
      messgae: '선수 판매 취소가 완료 되었습니다',
      '취소 정보': userTransactionPromise,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: error,messgae:'--트랜잭션 과정에서 오류 발생' });
  }
};

/**
 * 거래 내역을 생성하는 함수
 */
async function addSalesRecoreds(player) {
  const { name, player_unique_id, price } = player;
  await storePrisma.sales_records.create({
    data: {
      name,
      player_unique_id,
      price,
    },
  });
}

/**
 * 거래 내역을 조회하는 함수
 */
export const saleRecords = async (req, res) => {
  const records = await storePrisma.sales_records.findMany({});
  res.status(200).json({ messgae: records });
};

/**
 * 특정 카드의 시세를 조회하는 함수
 */

export const marketPrice = async (req, res) => {
  try {
    const { player_unique_id } = req.params;
    if (!player_unique_id) {
      return res.status(401).json({ messgae: 'params가 비어있습니다' });
    }
    const search = await storePrisma.sales_records.findMany({
      where: {
        player_unique_id: +player_unique_id,
      },
    });
    if (search.length == 0) {
      return res
        .status(404)
        .json({ messgae: '해당 선수는 판매된 기록이 존재하지 않습니다' });
    }
    return res.status(200).json({ message: search });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};
