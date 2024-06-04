import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt, { compareSync } from 'bcrypt';
import probability from '../utils/probability/index.js'
import { userPrisma, playerPrisma } from '../utils/prisma/index.js';

//감독 팀 내 선수 목록 조회 like 아이템 인벤토리
export const playerInventory = async (req, res, next) => {
  //director 경로 값 전달
  const { director } = req.params;
  //로그인 되어있는  user_id값 전달
  const userId = req.user_id;

  //const myUser = req.user;
  //
  //if (!myUser) {
  //  return res.status(402).json({ errorMessage: '내 계정이 아닙니다' });
  //}

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

    return res.status(200).json(CandidatePlayers);
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
};


//선수 뽑기 기능 추가
export const gacha = async (req, res) => {
  try {
    //0. 감독명이 URL을 통해 잘 전달되었는지,전달된 감독명이 DB에 존재하는지 검사한다
    const { director } = req.params;
    if (!director) {
      res
        .status(401)
        .json({ message: '감독명이 URL을 통해 전달되지 않았습니다' });
    }
    const team = await userPrisma.teams.findFirst({
      where: {
        director: director,
      },
    });
    if (!team) {
      return res
        .status(404)
        .json({ message: '해당 감독 이름으로 생성된 팀을 찾을 수 없습니다' });
    }
    console.log('0번 통과 완료');

    //1.로그인 미들웨어를 통과한 user_id와 parms로 받아온 teams 테이블의 감독명이 관계가 있는지 검사한다
    const user = req.user;
    if (team.User_id != user.user_id) {
      return res.status(403).json({
        message:
          '해당 감독의 정보에 접근할 권한을 가지고 있지 않습니다 ID 불일치',
      });
    }

    //2.team 변수의 감독이름 id와 연결된 budget 테이블을 찾는다
    const budget = await userPrisma.budget.findFirst({
      where: {
        Director: team.director,
      },
    });

    //3.buget에 이상이 있는지,돈이 있는지 확인한다
    if (!budget) {
      return res
        .status(404)
        .json({ message: '해당 팀의 소지금 테이블이 존재하지 않습니다' });
    }
    if (budget.money < 1000) {
      return res
        .status(402)
        .json({ message: '소지금이 부족합니다 : ' + budget.money });
    }

    //4.이상이 없다면 트랜잭션을 이용해 선수를 뽑고 돈을 차감한다음 선수의 데이터를 teams테이블의 candidate_players에 넣어준다
    const pick = await userPrisma.$transaction(async (tx) => {
      const { director } = req.params;
      const playerData = await pickPlayer();
      const exsistPlayerData = await tx.teams.findMany({
        where: {
          director: director,
        },
        select: {
          candidate_players: true,
        },
      });

      let playersArray = [];
      //1.기존 데이터를 가져온다
      //2.구조분해를 통해 스칼라 필드를 지운다
      //3.새 데이터를 삽입한다
      //4.update에 값을 넣어준다

      if (!exsistPlayerData[0].candidate_players.length) {
        //선수 정보가 하나도 없을때
        playersArray.push(playerData);
      } else {
        //선수 정보가 하나 이상 있을때
        playersArray.push(exsistPlayerData[0].candidate_players); //candidate_players 스텔라 필드의 데이터를 가져옴
        playersArray = playersArray.flat(Infinity); // 재귀적으로 배열을 평탄화 (원래는 2중배열임)
        playersArray.push(playerData); //새로 추가된 값을 1차 배열에 추가
      }

      console.log(JSON.stringify(playersArray, null, 2));

      await tx.teams.update({
        where: {
          director: director,
        },
        data: {
          candidate_players: playersArray,
        },
      });

      await tx.budget.update({
        where: {
          Director: budget.Director,
        },
        data: {
          money: {
            decrement: 1000,
          },
        },
      });
      return playerData;
    });
    if (!pick) {
      return res.status(500).json({ message: '뽑기 로직에서 오류 발생' });
    }
    return res.status(200).json({ data: pick });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

async function pickPlayer() {
  // 선수를 뽑는 로직 (모든 선수의 확률은 동일/게임 기획자만 건들 수 있게 하려면 어떻게 해야할지 고민해봐야함)
  const players = await playerPrisma.players.findMany({
    where: {
      enhance_figure: 1,
    },
  });
  /*
    변경전 코드로직 선수의 정보를 통째로 넘겨준다
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
    */
  const id = Math.floor(100000 + Math.random() * 900000);
  const condition = 100;
  const randomIndex = Math.floor(Math.random() * players.length);
  const { player_unique_id, name } = players[randomIndex];
  const pickResult = { id, player_unique_id, name, condition };
  return pickResult;
}

//선수 상세목록 조회 API
export const myPlayerInfo = async (req, res, next) => {
  //조회하는 클라이언트가 로그인 된 사용자인지

  //경로 매개변수 전달
  const playerId = req.params;

  const nowDirector = await userPrisma.teams.findFirst({
    where: {
      director: playerId.director,
    },
  });
  //candidate_player가 빈 객체일 경우
  if (Object.keys(nowDirector.candidate_players).length === 0) {
    return res.status(404).json({ message: 'candidate_player가 비어있습니다' });
  }
  //선수가 있다면
  const dirCandidatePlayer =
    nowDirector.candidate_players.create.player_unique_id;
  //   return res.status(403).json( dirCandidatePlayer );
  //해당 캐릭터의 선수 상세 조회
  if (
    playerId.director === nowDirector.director &&
    +playerId.player_unique_id === dirCandidatePlayer
  ) {
    const playerInfo = await playerPrisma.players.findFirst({
      where: {
        player_unique_id: +playerId.player_unique_id,
      },
      select: {
        player_unique_id: true,
        name: true,
        stat_fw: true,
        stat_mf: true,
        stat_df: true,
        enhance_figure: true,
        condition: true,
      },
    });
    return res.status(200).json({ playerInfo });
  } else {
    return res.status(403).json({ message: '해당 선수가 없습니다.' });
  }

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
  // }
};

//선수 강화 API
export const playerUpgrade = async (req, res, next) => {
  //director 경로 값 전달
  const { upgrade_player_id, material_player_id } = req.body;
  //로그인 되어있는  user_id값 전달
  const userId = req.user_id;
  const { director } = req.params;
  
  //강화하려는 선수가 내 선수 목록에 있는지 확인
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
    const CandidatePlayers = await userPrisma.teams.findMany({
      where: { director },
      select: {
        candidate_players: true,
      },
    });
    let playersArray = [];
    playersArray.push(CandidatePlayers[0].candidate_players);
    playersArray = playersArray.flat(Infinity);
    
    const upgradePlayer = playersArray.find(player => player.id == upgrade_player_id);
    
    if(!upgradePlayer){
      return res
        .status(403)
        .json({ errorMessage: '강화 할 선수가 존재하지 않습니다' });
    }

    const materialPlayer = playersArray.find((player) => player.id == material_player_id);

    if(!materialPlayer){
      return res
        .status(403)
        .json({ errorMessage: '재료 선수가 존재하지 않습니다' });
    }

    if(upgradePlayer.player_unique_id !== materialPlayer.player_unique_id){
      return res
      .status(400)
      .json({ errorMessage: '두 선수가 동일한 등급의 같은 선수가 아닙니다.' });
    }

    const upgrade_player = await playerPrisma.players.findFirst({
      where: {
        player_unique_id : upgradePlayer.player_unique_id,
      }
    })
  
    if(upgrade_player.enhance_figure > 9){
      return res
      .status(400)
      .json({ errorMessage: '더 이상 강화가 불가능한 선수 입니다.' });
    }

    //랜덤 값 생성(1~100)
    const randomNum = Math.floor(Math.random() * 100) + 1;
    let check = false;
    if(randomNum < probability(upgrade_player.enhance_figure)) {
      playersArray = playersArray.filter((player)=> player.id != upgrade_player_id);
      
      const upgradeSuccessPlayer = await playerPrisma.players.findFirst({
        where: {
          name : upgrade_player.name,
          enhance_figure : upgrade_player.enhance_figure + 1,
        }
      })
      const id = Math.floor(100000 + Math.random() * 900000);
      const condition = 100;
      const { player_unique_id, name } = upgradeSuccessPlayer;
      const pickResult = { id, player_unique_id, name, condition };
      playersArray.push(pickResult);
      check = true;
    }
    //선수 삭제
    playersArray = playersArray.filter((player)=> player.id != material_player_id);

    await userPrisma.teams.update({
      where: {
        director,
      },
      data: {
        candidate_players: playersArray,
      },
    });

    if(check === true){
      return res.status(200).json({ message : "강화 성공" });
    }
    return res.status(200).json({ message : "강화 실패" });
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
};
