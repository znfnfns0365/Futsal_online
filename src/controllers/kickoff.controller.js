import {
    userPrisma,
    matchPrisma,
    playerPrisma,
} from '../utils/prisma/index.js';
import { myPlayerInfo } from './player.controller.js';

const Teams = userPrisma.teams;
const Matches = matchPrisma.matches;
const Players = playerPrisma.players;

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
            .json({
                errorMessage: '본인의 계정에 존재하지 않는 감독명입니다.',
            });
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

    const result = await gaming(myTeam, opposingTeam);
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
    await delay(1000);

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
    if (result.myTeamScore === result.opposingTeamScore)
        return res.status(200).json({
            team: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
            director: `${newMyTeam.director} vs ${newOpposingTeam.director}`,
            result: `${result.myTeamScore} : ${result.opposingTeamScore} 무승부`,
            mySquad: result.mySquad,
            opposingSquad: result.opposingSquad,
            myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
        });

    // 무승부가 아닐 경우 결과 출력
    return res.status(200).json({
        team: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
        director: `${newMyTeam.director} vs ${newOpposingTeam.director}`,
        result: `${result.myTeamScore} : ${result.opposingTeamScore} ${
            result.myTeamScore > result.opposingTeamScore ? '승리!' : '패배..'
        }`,
        mySquad: result.mySquad,
        opposingSquad: result.opposingSquad,
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
            .json({
                errorMessage: '본인의 계정에 존재하지 않는 감독명입니다.',
            });
    }

    const opposingTeam = 0; // 자동매치메이킹함수(myTeam)
    const opposingDirector = opposingTeam;

    const result = await gaming(myTeam, opposingTeam);

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
    await delay(1000);
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
    if (result.myTeamScore === result.opposingTeamScore)
        return res.status(200).json({
            team: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
            director: `${newMyTeam.director} vs ${newOpposingTeam.director}`,
            result: `${result.myTeamScore} : ${result.opposingTeamScore} 무승부`,
            mySquad: result.mySquad,
            opposingSquad: result.opposingSquad,
            myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
        });

    // 무승부가 아닐 경우 결과 출력
    return res.status(200).json({
        team: `${newMyTeam.name} vs ${newOpposingTeam.name}`,
        director: `${newMyTeam.director} vs ${newOpposingTeam.director}`,
        result: `${result.myTeamScore} : ${result.opposingTeamScore} ${
            result.myTeamScore > result.opposingTeamScore ? '승리!' : '패배..'
        }`,
        mySquad: result.mySquad,
        opposingSquad: result.opposingSquad,
        myRecord: `${newMyTeam.win}승 ${newMyTeam.draw}무 ${newMyTeam.lose}패`,
    });
};

// delay용 함수
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 경기 진행 함수
async function gaming(myTeam, opposingTeam) {
    const team1 = myTeam.squad;
    const team2 = opposingTeam.squad;

    //빈 포지션 있는지 확인
    if (!(team1.fw && team1.mf && team1.df)) return 'team1';
    else if (!(team2.fw && team2.mf && team2.df)) return 'team2';

    //컨디션 불러오기
    const fwCondition1 = team1.fw.condition,
        mfCondition1 = team1.mf.condition,
        dfCondition1 = team1.df.condition,
        fwCondition2 = team2.fw.condition,
        mfCondition2 = team2.mf.condition,
        dfCondition2 = team2.df.condition;

    // 선수들 스탯 가져오기 myPlayer, opposingPlayer에 각각 fw, mf, df로 저장
    const playersIds = [
        team1.fw.player_unique_id,
        team1.mf.player_unique_id,
        team1.df.player_unique_id,
        team2.fw.player_unique_id,
        team2.mf.player_unique_id,
        team2.df.player_unique_id,
    ];
    const players = await Players.findMany({
        where: {
            player_unique_id: {
                in: playersIds,
            },
        },
        select: {
            player_unique_id: true,
            name: false,
            stat_df: true,
            stat_fw: true,
            stat_mf: true,
            enhance_figure: false,
            condition: false,
        },
    });
    let myPlayer = {},
        opposingPlayer = {};
    for (const obj of players) {
        if (team1.fw.player_unique_id === obj.player_unique_id)
            myPlayer.fw = obj.stat_fw;
        else if (team1.mf.player_unique_id === obj.player_unique_id)
            myPlayer.mf = obj.stat_mf;
        else if (team1.df.player_unique_id === obj.player_unique_id)
            myPlayer.df = obj.stat_df;
        else if (team2.fw.player_unique_id === obj.player_unique_id)
            opposingPlayer.fw = obj.stat_fw;
        else if (team2.mf.player_unique_id === obj.player_unique_id)
            opposingPlayer.mf = obj.stat_mf;
        else if (team2.df.player_unique_id === obj.player_unique_id)
            opposingPlayer.df = obj.stat_df;
    }

    // 점수 로직
    const attackPointTeam1 =
            myPlayer.fw / 2 +
            ((myPlayer.fw / 100) * fwCondition1) / 2 +
            myPlayer.mf / 2 +
            ((myPlayer.mf / 100) * mfCondition1) / 2,
        defensePointTeam1 =
            myPlayer.df / 2 +
            ((myPlayer.df / 100) * dfCondition1) / 2 +
            myPlayer.mf / 2 +
            ((myPlayer.mf / 100) * mfCondition1) / 2,
        attackPointTeam2 =
            opposingPlayer.fw / 2 +
            ((opposingPlayer.fw / 100) * fwCondition2) / 2 +
            opposingPlayer.mf / 2 +
            ((opposingPlayer.mf / 100) * mfCondition2) / 2,
        defensePointTeam2 =
            opposingPlayer.df / 2 +
            ((opposingPlayer.df / 100) * dfCondition2) / 2 +
            opposingPlayer.mf / 2 +
            ((opposingPlayer.mf / 100) * mfCondition2) / 2;

    const mySquad = `fw:${team1.fw.name + ' ' + myPlayer.fw}, mf:${
            team1.mf.name + ' ' + myPlayer.mf
        }, df:${team1.df.name + ' ' + myPlayer.df}`,
        opposingSquad = `fw:${team2.fw.name + ' ' + opposingPlayer.fw}, mf:${
            team2.mf.name + ' ' + opposingPlayer.mf
        }, df:${team2.df.name + ' ' + opposingPlayer.df}`;
    console.log(mySquad, '\n', opposingSquad);
    console.log('team1 - atk:', attackPointTeam1, 'def:', defensePointTeam1);
    console.log('team2 - atk:', attackPointTeam2, 'def:', defensePointTeam2);

    // myTeam 득점 로직
    let myTeamScore = (function () {
        // 득점 기회(opportunity) = 기본 득점 기회 = 5번 + (A팀의 공격포인트 - B팀의 수비 포인트)/10 번
        const opportunity =
            5 + Math.ceil((attackPointTeam1 - defensePointTeam2) / 10);
        let score = 0;
        // 득점 확률(probablility) = (공격수의 stat_fw + 미드필더의 stat_mf- 상대 수비수의 stat_df) /3
        const probablility =
            (myPlayer.fw + myPlayer.mf - opposingPlayer.df) / 3;
        for (let i = 0; i <= opportunity; i++) {
            if (Math.floor(Math.random() * 100) + 1 < probablility) {
                score++;
            }
        }
        console.log(
            `1팀의 득점 기회: ${opportunity}, 득점 확률: ${probablility}`
        );
        return score;
    })();

    // opposingTeam 득점 로직
    let opposingTeamScore = (function () {
        // 득점 기회(opportunity) = 기본 득점 기회 = 5번 + (A팀의 공격포인트 - B팀의 수비 포인트)/10 번
        const opportunity =
            5 + Math.ceil((attackPointTeam2 - defensePointTeam1) / 10);
        let score = 0;
        // 득점 확률(probablility) = (공격수의 stat_fw + 미드필더의 stat_mf- 상대 수비수의 stat_df) /3
        const probablility =
            (opposingPlayer.fw + opposingPlayer.mf - myPlayer.df) / 3;
        for (let i = 0; i <= opportunity; i++) {
            if (Math.floor(Math.random() * 100) + 1 < probablility) {
                score++;
            }
        }
        console.log(
            `2팀의 득점 기회: ${opportunity}, 득점 확률: ${probablility}`
        );
        return score;
    })();

    // 점수 return
    return { myTeamScore, opposingTeamScore, mySquad, opposingSquad };
}

// 매치 정보, 결과 업데이트 함수
async function updateRecords(myTeam, opposingTeam, result) {
    // 매치 정보 입력
    await Matches.create({
        data: {
            player1_id: myTeam.director,
            player2_id: opposingTeam.director,
            score_player1: result.myTeamScore,
            score_player2: result.opposingTeamScore,
        },
    });
    // 승리시 db 추가
    if (result.myTeamScore > result.opposingTeamScore) {
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
    else if (result.myTeamScore < result.opposingTeamScore) {
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
