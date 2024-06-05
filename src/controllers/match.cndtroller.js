import { matchPrisma, userPrisma } from '../utils/prisma/index.js';

//전적 조회 API
export const recordsCheck = async (req, res, next) => {
  //body로 조회할 팀명을 받아온다
  const { director } = req.body;

  //조회할 감독이 매치테이블에 있는지 찾는다
  const findRecord = await matchPrisma.matches.findMany({
    where: {
      OR: [{ player1_id: director }, { player2_id: director }],
    },
  });

  //전적이 없을경우
  if (findRecord.length === 0) {
    return res
      .status(401)
      .json({ messege: '해당 감독의 전적이 존재하지 않습니다' });
  }

  //반환
  return res.status(200).json(findRecord);
};

//전적 상세조회 API
export const detailRecord = async (req, res, next) => {
  //조회할 감독 경로 매개변수로 전달
  const { director } = req.params;

  //상세조회할 matchId를 body로 받는다
  const { matchId } = req.body;

  //감독명과 matchId가 일치한 전적을 찾는다
  const findRecord = await matchPrisma.matches.findFirst({
    where: {
      AND: [
        { OR: [{ player1_id: director }, { player2_id: director }] },
        { match_id: matchId },
      ],
    },
  });
  //전적이 없을경우
  if (findRecord === null) {
    return res
      .status(401)
      .json({ messege: '해당 감독의 전적이 존재하지 않습니다' });
  }
  const detailSquad1 = findRecord.player1_id;
  const detailSquad2 = findRecord.player2_id;

  //해당 팀 스쿼드 찾기
  const findSquad = await userPrisma.teams.findMany({
    where: {
      OR: [{ director: detailSquad1 }, { director: detailSquad2 }],
    },
    select: {
      director: true,
      name: true,
      squad: true,
      rating: true,
      win: true,
      draw: true,
      lose: true,
    },
  });
  return res.status(200).json(findSquad);
};
