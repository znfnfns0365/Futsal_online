# Team_Project_3

이 프로젝트를 구현하면서 배울수 있었던 것

1. **데이터베이스와 ORM**
    - 데이터베이스 스키마 설계
    - ORM (Prisma) 을 이용힌 데이터베이스 연동
    - ORM (Prisma) 을 통한 CRUD 작업
2. **인증**
    - 사용자 인증과 인가의 기본 원리 이해와 구현
    - JWT의 이해와 활용
3. **REST API**
    - REST API 설계
    - 웹 서버 프레임워크를 이용해 REST API를 구현
4. **협업 및 버전 관리**
    - Git을 사용해 소스 코드 버전 관리
    - Git branch를 이용하여 브랜치 관리 및 협업
    - Pull Request와 코드 리뷰 과정에 대한 이해

1. **프론트엔드와의 통신**
    - 웹 서버와 클라이언트 사이의 통신 원리 이해
    - HTTP 요청과 응답에 대한 이해
    - CORS에 대한 이해
    - JSON 형식 데이터의 활용

# API Documentation

| 만든 사람 | 현재 상태 | HTTP 메소드 | 기능명 | Endpoint | 미들웨어 인증 | 인증 방식 | Request Body |
|------------|------------|-------------|---------|----------|---------------|------------|--------------|
| 문현후     | 완료       | POST        | 회원가입 | /api/account/signUp | 미인증        |              | ```{ "user_id":"znfnfns0365@naver.com", "password":"a12345678", "confirm_password":"a12345678", "name":"김동헌" }``` |
| 안홍걸     | 완료       | POST        | 로그인   | /api/account/signIn | 인증         | JWT Token   | ```{ "user_id":"znfnfns0365@naver.com", "password":"a12345678" }``` |
| 김동헌     | 완료       | POST        | 팀/감독 생성 | /api/director       | 인증         | JWT Token   | ```{ "name":"대한민국", "director":"클린스만" }``` |
| 김동헌     | 완료       | GET         | 팀/감독 조회 | /api/director       | 인증         | JWT Token   |              |
| 김동헌     | 완료       | GET         | 팀/감독 상세 조회 | /api/director/:director | 인증         | JWT Token   |              |
| 김동헌     | 완료       | DELETE      | 팀/감독 삭제 | /api/director/:director | 인증         | JWT Token   |              |
| 김동헌     | 완료       | PATCH       | 팀/감독 수정 | /api/director/:director | 인증         | JWT Token   | ```{ "newName":"02대한민국" }``` |
| 양현언     | 완료       | PATCH       | 캐시 구매 | /api/director/:director/cash | 인증         | JWT Token   |              |
| 안홍걸     | 완료       | POST        | 선수 뽑기 | /api/store/gacha/:director | 인증         | JWT Token   |              |
| 문현후     | 완료       | GET         | 선수 목록 조회 | /api/player/:director | 미인증        |              |              |
| 문현후     | 완료       | GET         | 선수 상세 조회 | /api/player/:director/:player_unique_id | 미인증        |              |              |
| 손창환     | 완료       | GET         | 선발 선수 조회 | /api/squad/:director | 미인증        |              |              |
| 손창환     | 완료       | PATCH       | 선발 선수 추가/교체 | /api/squad/edit/:position | 인증         | JWT Token   | ```{ "id":872064, "position":"df" }``` |
| 문현후     | 완료       | PATCH       | 선수 방출 | /api/player/:director | 인증         | JWT Token   | ```{ "id": int, "player_unique_id": int }``` |
| 양현언     | 완료       | PATCH       | 선수 강화 | /api/player/upgrade/:director | 인증         | JWT Token   | ```{ "upgrade_player_id" : "", "material_player_id": "" }``` |
| 김동헌     | 완료       | GET         | 강화 가능 카드 조회 | /api/player/upgrade/:director | 인증         | JWT Token   |              |
| 김동헌     | 완료       | POST        | 상대 팀 지명 킥오프 | /api/kickoff/:director/:opposingDirector | 인증         | JWT Token   |              |
| 김동헌     | 완료       | POST        | 자동 매치 메이킹 킥오프 | /api/kickoff/:director | 인증         | JWT Token   |              |
| 안홍걸     | 완료       | GET         | 유저 랭킹 조회 | /api/director/ranking | 미인증        |              |              |
| 안홍걸     | 완료       | POST        | 선수 판매 (추가) | /api/player/sell | 인증         | JWT Token   | ```{ "director":"리세마라", "id":118626, "price":2000 }``` |
| 안홍걸     | 완료       | DELETE      | 판매 취소 (추가) | /api/store/sell/cancel | 인증         | JWT Token   | ```{ "selectId":102858, "director":"안첼로티" }``` |
| 문현후     | 완료       | PATCH       | 선수 구매 (추가) | /api/store/buy | 인증         | JWT Token   | ```{ "director":"정몽규", "id":984785 }``` |
| 문현후     | 완료       | GET         | 이적시장 목록 조회 | /api/store | 미인증        |              |              |
| 문현후     | 완료       | GET         | 감독 전적 검색 (추가) | /api/matches/ | 미인증        |              | ```{ "director":"히딩크" }``` |
| 문현후     | 완료       | GET         | 경기 상세 검색 (추가) | /api/matches/:director | 미인증        |              | ```{ "matchId":27 }``` |****


파일구조
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
