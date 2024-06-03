import { userPrisma } from '../utils/prisma/index.js';
import { playerPrisma } from '../utils/prisma/index.js';





//선수 뽑기 기능 추가
export const gacha =async (req,res)=>{
    
    try{
        //0. 감독명이 URL을 통해 잘 전달되었는지,전달된 감독명이 DB에 존재하는지 검사한다

        const director = req.params;
        if(!director){res.status(401).json({message:"감독명이 URL을 통해 전달되지 않았습니다"})};
        const team = await userPrisma.teams.findFirst({
            where:{
                director:director
            }
        })
        if(!team){res.status(404).json({message:"해당 감독 이름으로 생성된 팀을 찾을 수 없습니다"})};


        //1.로그인 미들웨어를 통과한 user_id와 parms로 받아온 teams 테이블의 감독명이 관계가 있는지 검사한다
        const user = req.user;
        if(team.User_id != user.user_id){res.status(403).json({message:"해당 감독의 정보에 접근할 권한을 가지고 있지 않습니다 ID 불일치"})};


        //2.team 변수의 감독이름 id와 연결된 budget 테이블을 찾는다
        const budget = await userPrisma.budget.findFirst({
            where:{
                Director:team.director
            }
        })


        //3.buget에 이상이 있는지,돈이 있는지 확인한다
        if(!budget){res.status(404).json({message:"해당 팀의 소지금 테이블이 존재하지 않습니다"})}
        if(budget.money < 1000){res.status(402).json({message:"소지금이 부족합니다 : "+budget.money})}


        //4.이상이 없다면 트랜잭션을 이용해 선수를 뽑고 돈을 차감한다음 선수의 데이터를 teams테이블의 candidate_players에 넣어준다
        const result = await userPrisma.$transaction(async (tx)=>{
            const pick = await tx.user.candidate_players.create(pickPlayer());
            if(!pick){res.status(500).json({message:"뽑기 로직에서 오류 발생"})}
            await tx.budget.update({
                where:{
                    Director:budget.Director
                },
                data:{
                    money:{
                        decrement:1000
                    }
                }
            })
        });
    }catch(error){
        res.status(500).json({errorMessage:error.message});
    }
}

async function pickPlayer() {
    // 선수를 뽑는 로직 (모든 선수의 확률은 동일/게임 기획자만 건들 수 있게 하려면 어떻게 해야할지 고민해봐야함)
    const players = await playerPrisma.players.findMany({
        where: {
            enhance_figure: 1
        }
    });
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
}
