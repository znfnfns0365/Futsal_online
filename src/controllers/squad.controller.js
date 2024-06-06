import { userPrisma, playerPrisma } from '../utils/prisma/index.js';

import { playerLoad } from '../utils/coffee.js';

const Teams = userPrisma.teams;
const Budget = userPrisma.budget;

const positionVali = ['df', 'fw', 'mf'];
const player_info = await playerLoad(); //players 원본데이터를 인메모리 방식으로 미리 저장

/* 팀의 선발 선수 체크 API */
export const checkDirectorTeam = async (req, res) => {
  try {
    const director = req.params.director; // parameter 가져오기

    // director 이름이 같은 객체를 찾기
    const team = await Teams.findFirst({
      where: { director },
      select: {
        director: true,
        User_id: true,
        name: true,
        squad: true,
      },
    });

    // 만약 director가 같은 팀이 없다면 오류 출력
    if (!team) {
      return res.status(404).json({
        errorMessage: `${director} 감독은 존재하지 않습니다.`,
      });
    }

    // 팀에 있는 squad에 각 포지션에 선수가 있는지 체크
    function positionCheck() {
      // 팀에 있는 squad에 각 포지션에 선수가 있는지 체크
      const array = [];
      for (const [position, player] of Object.entries(team.squad)) {
        if (!player) {
          array.push(position);
        }
      }

      // 어느 포지션에 없는지 에러메세지 출력
      if (array.length > 0) {
        throw new Error(`${array}에 선수가 존재하지 않습니다`);
      }
    }
    positionCheck();

    // 결과를 출력할 데이터 변수 선언
    const resultTeam = { director: false, squad: false };
    const resultSquad = { fw: false, mf: false, df: false };

    // 선수의 데이터 중 출력할 데이터들을 작성
    const needInfo = [
      'name',
      'stat_fw',
      'stat_mf',
      'stat_df',
      'enhance_figure',
    ];

    // squad의 선수 정보 중 출력할 정보만을 생성하여 대입
    for (const [position, player] of Object.entries(team.squad)) {
      // team에 등록된 player의 unique_id 를 이용해 DB데이터에서 정보를 찾아서 playerinfo_DB 에 저장
      const playerinfo_DB = player_info.find(
        (playerInfo) => playerInfo.player_unique_id === player.player_unique_id
      );

      // 필요한(출력할) 데이터만을 저장하기 위한 변수 저장
      const selectInfo = {};

      // needInfo = 필요한 데이터의 이름 저장소
      // forEach를 사용하여 필요한 데이터만을 뽑아 오기
      needInfo.forEach(
        (element) => (selectInfo[element] = playerinfo_DB[element])
      );

      // 지정된 포지션에 정보를 저장
      resultSquad[position] = selectInfo;
    }

    // 완성된 squad 정보를 출력정보에 대입
    resultTeam.director = director;
    resultTeam.squad = resultSquad;

    // 출력
    return res.status(200).json(resultTeam);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
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
      return res.status(403).json({
        errorMessage: `입력하신 감독은 본인 소유가 아닙니다.`,
      });
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
          squad: sortSquad(squad),
        },
      });
    });

    return res.status(200).json(sortSquad(squad));
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// 포지션 순서를 조정하는 함수
function sortSquad(squad) {
  return {
    fw: squad.fw,
    mf: squad.mf,
    df: squad.df,
  };
}
