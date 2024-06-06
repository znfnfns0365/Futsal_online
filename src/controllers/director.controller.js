import { userPrisma, playerPrisma } from '../utils/prisma/index.js';
import { playerLoad } from '../utils/coffee.js';
import { gacha } from './player.controller.js'; // 감독 생성시 선수 3명을 자동 지급하기 위해서

const Teams = userPrisma.teams;
const Budget = userPrisma.budget;

/* 감독 생성 API */
export const createDirector = async (req, res) => {
  try {
    const { director, name } = req.body;
    const user = req.user;

    //동일한 director 이름 검사
    const sameName = await Teams.findFirst({
      // 동일한 director가 User에게 있는지 찾음
      where: { director },
    });

    //ranking 감독은 api상 만들지 못하도록 예외 처리
    if (director === 'ranking' || director === 'upgrade') {
      return res
        .status(400)
        .json({
          errorMessage: `${director}(이)라는 감독명은 제한되어 있습니다.`,
        });
    }

    if (sameName) {
      // 있다면 에러 메시지 전송
      return res
        .status(400)
        .json({ errorMessage: '동일한 이름을 가진 감독이 존재합니다' });
    }

    //동일한 팀 이름(name) 검사
    const sameTeam = await Teams.findFirst({
      // 동일한 director가 User에게 있는지 찾음
      where: { name },
    });
    if (sameTeam) {
      // 있다면 에러 메시지 전송
      return res
        .status(400)
        .json({ errorMessage: '동일한 이름을 가진 팀이 존재합니다' });
    }

    const newTeam = await Teams.create({
      // 팀 추가
      data: {
        director,
        User_id: user.user_id,
        name,
        candidate_players: {},
        squad: {
          fw: false,
          mf: false,
          df: false,
        },
      },
    });
    await Budget.create({
      data: {
        Director: newTeam.director,
      },
    });
    //3명의 새 선수 지급 다만 무료로 주는건 아니고 자동으로 뽑음...
    const freeGacha = [];
    for (let i = 0; i < 3; i++) {
      console.log(i + '번째 실행중@@@@@@');
      await fetch(`http://localhost:3001/api/store/gacha/${director}`, {
        //URL은 추후 변경할 예정
        method: 'POST',
        headers: {
          Authorization: req.token, //토큰값을 넣어줘야함
        },
      })
        .then((response) => response.json())
        .then((data) => {
          freeGacha.push(data);
        })
        .catch((error) => {
          console.log('Error:', error);
        });
    }

    return res.status(201).json({ newTeam, ...freeGacha });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

/* 감독 조회 API */
export const checkDirector = async (req, res) => {
  const teamList = await Teams.findMany({
    select: {
      name: true,
      director: true,
      User_id: true,
    },
    orderBy: { User_id: 'asc' },
    where: {
      User_id: req.user.user_id,
    },
  });

  return res.status(200).json({ teamList });
};

/* 감독 상세 조회 API */
export const checkDirectorDetail = async (req, res) => {
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    // director가 같은 객체 찾기
    where: { director },
    select: {
      director: true,
      User_id: true,
      name: true,
      candidate_players: false,
      squad: false,
      rating: true,
      win: true,
      draw: true,
      lose: true,
    },
  });

  if (!team) {
    // 없으면 에러 메시지
    return res
      .status(404)
      .json({ errorMessage: `${director} 감독은 존재하지 않습니다.` });
  }

  return res.status(200).json(team);
};

/* 팀/감독 삭제 API */
export const deleteDirector = async (req, res) => {
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!team) {
    // 없으면 에러 메시지
    return res.status(404).json({ errorMessage: '삭제할 팀/감독이 없습니다.' });
  }

  const name = team.name;
  if (team.User_id !== req.user.user_id) {
    // 다른 유저의 팀/감독 삭제 시도
    return res
      .status(404)
      .json({ errorMessage: '다른 사용자의 팀/감독입니다.' });
  }

  await Teams.delete({
    where: {
      director,
      User_id: req.user.user_id,
    },
  }); // director, User_id가 같은 객체 삭제

  return res
    .status(200)
    .json({ message: `팀 ${name}, ${director} 감독이 방출되었습니다.` });
};

/* 팀/감독 수정 API */
export const updateDirector = async (req, res) => {
  const { newDirector, newName } = req.body;
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!team) {
    // 없으면 에러 메시지
    return res.status(404).json({ errorMessage: '수정할 팀/감독이 없습니다.' });
  }

  const name = team.name;
  if (team.User_id !== req.user.user_id) {
    // 다른 유저의 팀/감독 삭제 시도
    return res
      .status(404)
      .json({ errorMessage: '다른 사용자의 팀/감독입니다.' });
  }

  await Teams.update({
    where: {
      director,
      User_id: req.user.user_id,
    },
    data: {
      director: newDirector,
      name: newName,
    },
  });

  return res.status(200).json({
    message: `팀 ${newName ?? name}, ${
      newDirector ?? director
    } 감독으로 수정되었습니다.`,
  });
};

/** 캐시 충전 API */
export const cashCarge = async (req, res) => {
  try {
    const Director = req.params.director;
    const user = req.user;

    const team = await Budget.findFirst({
      where: {
        Director,
        User_id: user.user_Id,
      },
    });

    if (!team) {
      return res.status(403).json({ message: '내 감독이 아닙니다.' });
    }

    await Budget.update({
      where: { Director },
      data: { money: { increment: 10000 } },
    });

    const updatedBudget = await Budget.findUnique({
      where: { Director },
      select: { money: true },
    });
    return res.status(200).json({
      message: '캐시가 충전되었습니다.',
      money: updatedBudget.money,
    });
  } catch (error) {
    console.error('캐시 충전 중 에러 발생:', error);
    return res
      .status(500)
      .json({ message: '캐시 충전 중 오류가 발생했습니다.' });
  }
};

//rating 순서대로 감독을 줄세워야함

export const ranking = async (req, res) => {
  //모든 팀을 불러와서 감독명,팀명,레이팅,승,무,패 정보를 가져온다
  try {
    const result = await Teams.findMany({
      where: {
        OR: [{ win: { gt: 0 } }, { draw: { gt: 0 } }, { lose: { gt: 0 } }],
      },
      orderBy: {
        rating: 'asc',
      },
      select: {
        director: true,
        name: true,
        rating: true,
        win: true,
        draw: true,
        lose: true,
      },
    });
    if (!result) {
      return res.status(404).json({ message: '경기 내역이 존재하지 않습니다' });
    }
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({
      errorMessage: error.message + 'rating 기능에서 오류 발생',
    });
  }
};
