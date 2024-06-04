import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { userPrisma, playerPrisma } from '../utils/prisma/index.js';

const Teams = userPrisma.teams;
const Budget = userPrisma.budget;
const positionVali = ['df', 'fw', 'mf'];

/* 감독 생성 API */
export const createDirector = async (req, res) => {
  const { director, name } = req.body;
  const user = req.user;

  //동일한 director 이름 검사
  const sameName = await Teams.findFirst({
    // 동일한 director가 User에게 있는지 찾음
    where: { director, User_Id: user.user_Id },
  });
  if (sameName) {
    // 있다면 에러 메시지 전송
    return res
      .status(400)
      .json({ errorMessage: '동일한 이름을 가진 감독이 존재합니다' });
  }

  //동일한 팀 이름(name) 검사
  const sameTeam = await Teams.findFirst({
    // 동일한 director가 User에게 있는지 찾음
    where: { name, User_Id: user.user_Id },
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
  return res.status(201).json({ newTeam });
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

/* 팀의 선발 선수 체크 API */
export const checkDirectorTeam = async (req, res) => {
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    // director가 같은 객체 찾기
    where: { director },
    select: {
      director: true,
      User_id: true,
      name: true,
      squad: true,
    },
  });

  if (!team) {
    // 없으면 에러 메시지
    return res
      .status(404)
      .json({ errorMessage: `${director} 감독은 존재하지 않습니다.` });
  }
  const { df, fw, mf } = team.squad;

  if (!df) {
    return res
      .status(404)
      .json({ errorMessage: `df에 선수를 등록하지 않았습니다.` });
  } else if (!fw) {
    return res
      .status(404)
      .json({ errorMessage: `fw에 선수를 등록하지 않았습니다.` });
  } else if (!mf) {
    return res
      .status(404)
      .json({ errorMessage: `mf에 선수를 등록하지 않았습니다.` });
  }

  return res.status(200).json(team.squad);
};

/* 팀의 선발 선수 변경 API /squad/change/:director */
export const changeTeamPlayer = async (req, res) => {
  try {
    const director = req.params.director; // parameter 가져오기
    const { id } = req.body; // req.body로 position과 id 가져오기
    let { position } = req.body;
    const user = req.user;

    // 포지션의 대문자 값을 소문자로 변경
    position = position.toLowerCase();

    // 해당 감독 변수 저장
    const team = await Teams.findFirst({
      // director가 같은 객체 찾기
      where: { director },
      select: {
        director: true,
        User_id: true,
        name: true,
        squad: true,
        candidate_players: true,
      },
    });

    // 해당 감독이 유저의 소유인지 확인
    if (team.User_id !== user.user_id) {
      return res
        .status(403)
        .json({ errorMessage: `입력하신 감독은 본인 소유가 아닙니다.` });
    }

    // 해당 감독 인벤토리 찾기
    const [CandidatePlayers] = await userPrisma.teams.findMany({
      where: { director },
      select: {
        candidate_players: true,
        squad: true,
      },
    });

    // 해당 감독의 인벤토리에 body으로 받은 id 를 가진 player들중 제일 앞 요소를 가져옴
    const isExistPlayer = CandidatePlayers.candidate_players.find(
      (player) => player.id === id
    );

    // 해당 감독의 인벤토리에 없다면 404 code를 return
    if (!isExistPlayer) {
      return res.status(404).json({
        errorMessage: `${director} 감독은 ${id} 라는 id를 가진 선수를 소지하고 있지 않습니다.`,
      });
    }

    // 포지션의 입력이 제대로 되었는가 확인
    if (!positionVali.includes(position)) {
      return res.status(404).json({
        errorMessage: `잘못된 포지션을 입력하셨습니다. 입력하신 포지션 = ${position}`,
      });
    }

    const squad = team.squad;
    //선수의 player_unique_id,id,condition 정보가 들어가야 한다
    const squadPlayer = {
      player_unique_id: isExistPlayer.player_unique_id,
      id: isExistPlayer.id,
      condition: isExistPlayer.condition,
    };

    //트랜잭션을 시작 (스쿼드에 선수가 이미 있는 경우 선수를 빼주고 다시 넣어야하니까!)

    const result = await userPrisma.$transaction(async (tx) => {
      //스쿼드에 넣으려고 하는 포지션에 선수가 있는가?

      //선수가 있는경우 -> 그 선수를 다시 락커룸으로 보내고 새로운 선수를 할당
      if (squad[position]) {
        CandidatePlayers.candidate_players.push(squad[position]); // 스쿼드에 있는 선수 -> 락커룸
        squad[position] = isExistPlayer; // 락커룸에 있던 지정한 선수 -> 스쿼드
        // 스쿼드로 들어간 선수는 락커룸에서 제외
        CandidatePlayers.candidate_players =
          CandidatePlayers.candidate_players.filter(
            (player) => player.id !== id
          );
        console.log(
          JSON.stringify(CandidatePlayers.candidate_players, null, 2)
        );
        console.log(JSON.stringify(squad, null, 2));
      } //선수가 없는경우 -> 그냥 새로운 선수를 할당
      else {
        // 비어있는 스쿼드에 락커룸의 선수를 출전시킴
        squad[position] = isExistPlayer;
        // 출전 시킨 선수는 락커룸에서 제외
        CandidatePlayers.candidate_players =
          CandidatePlayers.candidate_players.filter(
            (player) => player.id !== id
          );
      }

      // 바꾼 정보를 DB에 다시 입력
      await tx.teams.update({
        where: {
          director: director,
        },
        data: {
          candidate_players: CandidatePlayers.candidate_players,
          squad: squad,
        },
      });
    });
    return res.status(200).json(team.squad);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
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
    return res
      .status(500)
      .json({ errorMessage: error.message + 'rating 기능에서 오류 발생' });
  }
};
