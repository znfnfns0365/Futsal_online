import jwt from 'jsonwebtoken';
import express from "express";
import dotenv from 'dotenv';
import {findAccount,checkPassword} from '../utils/coffee.js'


export const signIn = async (req,res) =>{
    try{
        const {user_id,password} =req.body;
        const user = await findAccount(user_id);
        checkPassword(user,password);
        const token = jwt.sign(
            { accountId: user.accountId },
            process.env.JWT_SECRET,
            {
              expiresIn: '1h',
            }
          );
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(200).json({message:'로그인 성공 인증토큰 발행 완료'});
        
    }catch(error){
        res.status(500).json({errorMessage:"로그인 중 문제 발생"});
    }
}

