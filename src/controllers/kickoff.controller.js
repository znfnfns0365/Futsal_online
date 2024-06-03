import { userPrisma } from '../utils/prisma/index.js';

const Teams = userPrisma.teams;

// delay용 함수
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 경기 진행 함수
function gaming(team1, team2) {
  //빈 포지션 있는지 확인
  if (!(team1.fw && team1.mf && team1.df)) return 'team1';
  else if (!(team2.fw && team2.mf && team2.df)) return 'team2';

  const attackPointTeam1 = team1.fw * fwCondition1 + team1.mf * mfCondition1,
    attackPointTeam2 = team2.fw * fwCondition2 + team2.mf * mfCondition2,
    defensePointTeam1 = team1.df * dfCondition1 + team1.mf * mfCondition1,
    defensePointTeam2 = team2.df * mfCondition2 + team2.mf * mfCondition2;
  let team1Score = (function () {
    const repeat = Math.floor((defensePointTeam2 - attackPointTeam1) / 10);
    let score = 0;
    for (let i = 0; i <= repeat; i++) {
      if (Math().random % 10 < 5) {
        // 골
        score++;
      }
    }
    return score;
  })();
  let team2Score = (function () {
    const repeat = Math.floor((defensePointTeam1 - attackPointTeam2) / 10);
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

  const result = gaming(myTeam.squad, opposingTeam.squad);
  if (result === 'team1') {
    return res
      .status(400)
      .json({ errorMessage: '당신의 squad에 빈 포지션이 존재합니다' });
  } else if (result === 'team2') {
    return res
      .status(400)
      .json({ errorMessage: '상대의 squad에 빈 포지션이 존재합니다' });
  }
  console.log('경기중!');
  await delay(2000);

  return res.status(200).json({ myTeam, opposingTeam, result });
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

  const result = gaming(myTeam.squad, opposingTeam.squad);

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
  return res.status(200).json({ myTeam, opposingTeam, result });
};
