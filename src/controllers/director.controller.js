import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { userPrisma } from '../utils/prisma/index.js';

const Teams = userPrisma.teams;

/* 감독 생성 API */
export const createDirector = async (req, res) => {
  const { director, name } = req.body;
  const user = req.user;

  //동일한 director 이름 검사
  const sameName = await Teams.findFirst({
    // 동일한 director가 User에게 있는지 찾음
    where: { director, User_Id: user.user_Id },
  });
  if (sameName) {
    // 있다면 에러 메시지 전송
    return res
      .status(400)
      .json({ errorMessage: '동일한 이름을 가진 감독이 존재합니다' });
  }

  //동일한 팀 이름(name) 검사
  const sameTeam = await Teams.findFirst({
    // 동일한 director가 User에게 있는지 찾음
    where: { name, User_Id: user.user_Id },
  });
  if (sameTeam) {
    // 있다면 에러 메시지 전송
    return res
      .status(400)
      .json({ errorMessage: '동일한 이름을 가진 팀이 존재합니다' });
  }

  const newTeam = await Teams.create({
    // 팀 추가
    data: {
      director,
      User_id: user.user_id,
      name,
      candidate_players: {},
      squad: {
        fw: false,
        mf: false,
        df: false,
      },
    },
  });

  return res.status(201).json({ newTeam });
};

/* 감독 조회 API */
export const checkDirector = async (req, res) => {
  const teamList = await Teams.findMany({
    select: {
      name: true,
      director: true,
      User_id: true,
    },
    orderBy: { User_id: 'asc' },
    where: {
      User_id: req.user.user_id,
    },
  });

  return res.status(200).json({ teamList });
};

/* 감독 상세 조회 API */
export const checkDirectorDetail = async (req, res) => {
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    // director가 같은 객체 찾기
    where: { director },
    select: {
      director: true,
      User_id: true,
      name: true,
      candidate_players: false,
      squad: false,
      rating: true,
      win: true,
      draw: true,
      lose: true,
    },
  });

  if (!team) {
    // 없으면 에러 메시지
    return res
      .status(404)
      .json({ errorMessage: `${director} 감독은 존재하지 않습니다.` });
  }

  return res.status(200).json(team);
};

/* 팀/감독 삭제 API */
export const deleteDirector = async (req, res) => {
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!team) {
    // 없으면 에러 메시지
    return res.status(404).json({ errorMessage: '삭제할 팀/감독이 없습니다.' });
  }

  const name = team.name;
  if (team.User_id !== req.user.user_id) {
    // 다른 유저의 팀/감독 삭제 시도
    return res
      .status(404)
      .json({ errorMessage: '다른 사용자의 팀/감독입니다.' });
  }

  await Teams.delete({
    where: {
      director,
      User_id: req.user.user_id,
    },
  }); // director, User_id가 같은 객체 삭제

  return res
    .status(200)
    .json({ message: `팀 ${name}, ${director} 감독이 방출되었습니다.` });
};

/* 팀/감독 수정 API */
export const updateDirector = async (req, res) => {
  const { newDirector, newName } = req.body;
  const director = req.params.director; // parameter 가져오기

  const team = await Teams.findFirst({
    where: {
      director,
      User_id: req.user.user_id,
    },
  });
  if (!team) {
    // 없으면 에러 메시지
    return res.status(404).json({ errorMessage: '수정할 팀/감독이 없습니다.' });
  }

  const name = team.name;
  if (team.User_id !== req.user.user_id) {
    // 다른 유저의 팀/감독 삭제 시도
    return res
      .status(404)
      .json({ errorMessage: '다른 사용자의 팀/감독입니다.' });
  }

  await Teams.update({
    where: {
      director,
      User_id: req.user.user_id,
    },
    data: {
      director: newDirector,
      name: newName,
    },
  });

  return res.status(200).json({
    message: `팀 ${newName ?? name}, ${
      newDirector ?? director
    } 감독으로 수정되었습니다.`,
  });
};
