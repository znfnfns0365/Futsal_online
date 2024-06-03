import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { userPrisma } from '../utils/prisma/index.js';

//감독 팀 내 선수 목록 조회 like 아이템 인벤토리
export const playerInventory = async (req, res, next) => {
  //director 경로 값 전달
  const { director } = req.params;
  //로그인 되어있는  user_id값 전달
  const userId = req.user_id;

  //찾으려는 인벤토리가 내 계정의 인벤토리인지 검증
  try {
    const myAccount = await userPrisma.teams.findFirst({
      where: {
        //로그인된 계정의 여러개의 감독 중 찾고자 하는 감독이 있는지 검증
        user_id: userId,
        director,
      },
    });
    if (!myAccount) {
      return res
        .status(401)
        .json({ errorMessage: '해당 감독이 존재하지 않습니다' });
    }

    //해당 감독 인벤토리 찾기
    const [CandidatePlayers] = await userPrisma.teams.findMany({
      where: { director },
      select: {
        candidate_players: true,
      },
    });

    //데이터베이스 candidate_player에는 player_unique_id가 들어가있다
    //그거를 map으로 변환해서 res에는 선수의 이름도 출력되게 바꾸기
    //for(const CandidatePlayer of CandidatePlayers){
    //    const {player_id} = CandidatePlayers;
    //
    //    const playerInfo = await userPrisma.teams.findUnique({
    //        where:{player_unique_id:player_id},
    //        select:{
    //            player_unique_id:true,
    //        }
    //    })
    //}

    return res.status(200).json(CandidatePlayer);
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
};
