import { userPrisma, matchPrisma } from '../utils/prisma/index.js';
import { myPlayerInfo } from './player.controller.js';

const Teams = userPrisma.teams;
const Matches = matchPrisma.matches;

export const kickoff = async (req, res) => {
  const { director, opposingDirector } = req.params;

  // user에게 director가 존재하는지 확인
  const myTeam = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!myTeam) {
    return res
      .status(400)
      .json({ errorMessage: '본인의 계정에 존재하지 않는 감독명입니다.' });
  }

  // 상대 팀 감독이 존재하는지, 자신의 팀과 붙는 지 확인
  const opposingTeam = await Teams.findFirst({
    where: {
      director: opposingDirector,
    },
  });
  if (!opposingTeam) {
    return res
      .status(400)
      .json({ errorMessage: '존재하지 않는 상대 감독명입니다.' });
  } else if (opposingTeam.User_id === req.user.user_id) {
    return res
      .status(400)
      .json({ errorMessage: '본인의 감독끼리는 게임할 수 없습니다.' });
  }

  const result = gaming(myTeam, opposingTeam);
  if (result === 'team1') {
    return res
      .status(400)
      .json({ errorMessage: '당신의 squad에 빈 포지션이 존재합니다' });
  } else if (result === 'team2') {
    return res
      .status(400)
      .json({ errorMessage: '상대의 squad에 빈 포지션이 존재합니다' });
  }

  // 경기 가능
  console.log('경기중!');
  await delay(2000);

  // 매치 정보, 결과 업데이트  함수 호출
  await updateRecords(myTeam, opposingTeam, result);

  //매치 정보 업데이트를 위한 newMyTeam, newOpposingTeam
  const newMyTeam = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  const newOpposingTeam = await Teams.findFirst({
    where: {
      director: opposingDirector,
    },
  });

  // 무승부시 결과 출력
  if (result[0] === result[1])
    return res.status(200).json({
      message: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
      result: `${result[0]} : ${result[1]}로 무승부`,
      myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
    });

  // 무승부가 아닐 경우 결과 출력
  return res.status(200).json({
    message: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
    result: `${result[0]} : ${result[1]}로 ${
      result[0] > result[1] ? '승리!' : '패배..'
    }`,
    myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
  });
};

export const automaticKickoff = async (req, res) => {
  const { director } = req.params;

  // user에게 director가 존재하는지 확인
  const myTeam = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!myTeam) {
    return res
      .status(400)
      .json({ errorMessage: '본인의 계정에 존재하지 않는 감독명입니다.' });
  }

  const opposingTeam = 0; // 자동매치메이킹함수(myTeam)

  const result = gaming(myTeam, opposingTeam);

  // 빈 포지션이 있을 때 (경기 불가)
  if (result === 'team1') {
    return res
      .status(400)
      .json({ errorMessage: '당신의 squad에 빈 포지션이 존재합니다' });
  } else if (result === 'team2') {
    return res
      .status(400)
      .json({ errorMessage: '상대의 squad에 빈 포지션이 존재합니다' });
  }

  // 경기 가능
  console.log('경기중!');
  await delay(2000);
  // 매치 정보, 결과 업데이트  함수 호출
  await updateRecords(myTeam, opposingTeam, result);

  //매치 정보 업데이트를 위한 newMyTeam, newOpposingTeam
  const newMyTeam = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  const newOpposingTeam = await Teams.findFirst({
    where: {
      director: opposingDirector,
    },
  });

  // 무승부시 결과 출력
  if (result[0] === result[1])
    return res.status(200).json({
      message: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
      result: `${result[0]} : ${result[1]}로 무승부`,
      myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
    });

  // 무승부가 아닐 경우 결과 출력
  return res.status(200).json({
    message: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
    result: `${result[0]} : ${result[1]}로 ${
      result[0] > result[1] ? '승리!' : '패배..'
    }`,
    myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
  });
};

// delay용 함수
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 경기 진행 함수
function gaming(myTeam, opposingTeam) {
  const team1 = myTeam.squad;
  const team2 = opposingTeam.squad;

  //빈 포지션 있는지 확인
  //   if (!(team1.fw && team1.mf && team1.df)) return 'team1';
  //   else if (!(team2.fw && team2.mf && team2.df)) return 'team2';
  team1.fw = 180;
  team1.mf = 130;
  team1.df = 100;

  team2.fw = 150;
  team2.mf = 130;
  team2.df = 100;

  //컨디션 불러오기
  const fwCondition1 = 100,
    mfCondition1 = 100,
    dfCondition1 = 100,
    fwCondition2 = 100,
    mfCondition2 = 100,
    dfCondition2 = 100;

  // 점수 로직
  const attackPointTeam1 =
      (team1.fw / 100) * fwCondition1 + (team1.mf / 100) * mfCondition1,
    defensePointTeam1 =
      (team1.df / 100) * dfCondition1 + (team1.mf / 100) * mfCondition1,
    attackPointTeam2 =
      (team2.fw / 100) * fwCondition2 + (team2.mf / 100) * mfCondition2,
    defensePointTeam2 =
      (team2.df / 100) * dfCondition2 + (team2.mf / 100) * mfCondition2;
  console.log('team1:', attackPointTeam1, defensePointTeam1);
  console.log('team2:', attackPointTeam2, defensePointTeam2);
  let team1Score = (function () {
    const repeat = 5 + Math.floor(attackPointTeam1 / defensePointTeam2 / 10);
    let score = 0;
    for (let i = 0; i <= repeat; i++) {
      if (Math.floor(Math.random() * 10) + 1 < 5) {
        // 40% 확률로 득점 성공
        score++;
      }
    }
    return score;
  })();
  let team2Score = (function () {
    const repeat = 5 + Math.floor((attackPointTeam2 - defensePointTeam1) / 10);
    let score = 0;
    // 수비 점수 - 공격 점수
    for (let i = 0; i <= repeat; i++) {
      if (Math.floor(Math.random() * 10) + 1 < 5) {
        // 40% 확률로 득점 성공
        score++;
      }
    }
    return score;
  })();
  return [team1Score, team2Score];
}

// 매치 정보, 결과 업데이트 함수
async function updateRecords(myTeam, opposingTeam, result) {
  // 매치 정보 입력
  await Matches.create({
    data: {
      player1_id: myTeam.director,
      player2_id: opposingTeam.director,
      score_player1: result[0],
      score_player2: result[1],
    },
  });
  // 승리시 db 추가
  if (result[0] > result[1]) {
    await Teams.update({
      data: {
        win: myTeam.win + 1,
      },
      where: {
        director: myTeam.director,
      },
    });
    await Teams.update({
      data: {
        lose: opposingTeam.lose + 1,
      },
      where: {
        director: opposingTeam.director,
      },
    });
  }
  // 패배시 db 추가
  else if (result[0] < result[1]) {
    await Teams.update({
      data: {
        win: opposingTeam.win + 1,
      },
      where: {
        director: opposingTeam.director,
      },
    });
    await Teams.update({
      data: {
        lose: myTeam.lose + 1,
      },
      where: {
        director: myTeam.director,
      },
    });
  }
  // 무승부시 db 추가 및 출력
  else {
    await Teams.update({
      data: {
        draw: opposingTeam.draw + 1,
      },
      where: {
        director: opposingTeam.director,
      },
    });
    await Teams.update({
      data: {
        draw: myTeam.draw + 1,
      },
      where: {
        director: myTeam.director,
      },
    });
  }
}
