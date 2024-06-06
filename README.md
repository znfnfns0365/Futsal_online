# Team_Project_3
```
Team_project_3
├── .env
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
├── README.md
├── tree.txt
├── yarn.lock
├── prisma
│   ├── match.schema.prisma
│   ├── player.schema.prisma
│   ├── store.schema.prisma
│   └── user.schema.prisma
└── src
    ├── app.js
    ├── controllers
    │   ├── account.controller.js
    │   ├── director.controller.js
    │   ├── kickoff.controller.js
    │   ├── match.cndtroller.js
    │   ├── player.controller.js
    │   ├── README.md
    │   ├── squad.controller.js
    │   └── store.controller.js
    ├── middlewares
    │   ├── auth.middleware.js
    │   ├── error-handling.middlewares.js
    │   └── README.md
    ├── routers
    │   ├── accounts.js
    │   ├── directors.js
    │   ├── kickoff.js
    │   ├── matches.js
    │   ├── players.js
    │   ├── README.md
    │   ├── squads.js
    │   └── store.js
    └── utils
        ├── coffee.js
        ├── prisma
        │   └── index.js
        └── probability
            └── index.js
```


# 게임 매치메이킹 및 점수 계산 로직

이 프로젝트는 A 유저와 B 유저 간의 게임을 구현하며, 각 유저의 스쿼드를 사용합니다.
게임 결과는 선수들의 스탯과 기여도에 따라 계산됩니다.

## 킥오프 로직

### 1. 스쿼드 선택
- A 유저는 자신의 스쿼드에서 3명의 선수를 선택합니다.
- B 유저는 자신의 스쿼드에서 3명의 선수를 선택합니다.

### 2. 스탯 계산
- **공격 스탯**:```javascript 공격 스탯 = stat_fw 포지션 선수의 stat_fw값 + stat_mf 포지션 선수의 stat_mf값 ```
- **수비 스탯**:```javascript 수비 스탯 = stat_df 포지션 선수의 stat_df값 + stat_mf 포지션 선수의 stat_mf 값 ```

### 3. 득점 기회 계산
득점 기회(opportunity)는 다음과 같이 계산됩니다: ```javascript 기본 득점 기회 5번 + (A팀의 공격 포인트 - B팀의 수비 포인트) / 10번 ```

### 4. 득점 확률 계산
득점 확률(probability)은 다음과 같이 계산됩니다: ```javascript (공격수의 stat_fw + 미드필더의 stat_mf - 상대 수비수의 stat_df) / 3 ```

### 5. 득점 포인트 계산
득점 확률을 바탕으로 각 팀의 득점 포인트를 계산합니다.
예를 들어, 득점 확률이 21%이고 득점 기회가 7번이라면, 3번 성공하여 A팀은 3득점을 얻게 됩니다.

### 6. 승패 결정
A 유저와 B 유저의 득점 포인트를 비교하여 승패를 결정합니다.

## 점수 기반 매치메이킹 로직
스쿼드에 선수가 모두 선발되어 있는 팀 중 점수 차이가 가장 적은 3팀 중 무작위로 1팀과 매치메이킹이 성사됩니다.

## 컨디션 적용 로직
컨디션에 따라 공격 포인트와 득점 확률에 적용되는 선수의 스탯이 달라집니다.

```javascript A 선수의 공격 스탯 = stat_fw / 2 + (stat_fw / 2) / 100 * condition ```

예를 들어, 컨디션이 0이면 자신의 스탯의 절반이 공격 점수로 들어가고, 100이면 스탯 모두가 적용됩니다.

## 경기 결과에 따른 컨디션 변화
- **경기 출전, 승리**: 컨디션 0 ~ 5 감소 - **경기 출전, 패배**: 컨디션 5 ~ 10 감소 - **경기 출전, 무승부**: 컨디션 1 ~ 10 감소 - **경기 미출전**: 컨디션 1 ~ 10 상승

컨디션은 0에서 100 사이의 값입니다.
