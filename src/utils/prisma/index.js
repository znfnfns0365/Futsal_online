import { PrismaClient as user } from '../../../prisma/generated/client1/index.js';
import { PrismaClient as player } from '../../../prisma/generated/client2/index.js';
import { PrismaClient as match } from '../../../prisma/generated/client3/index.js';
import { PrismaClient as store } from '../../../prisma/generated/client4/index.js';

export const userPrisma = new user({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});

export const playerPrisma = new player({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});

export const matchPrisma = new match({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
});

export const storePrisma = new store({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

export const storePrisma = new store({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});
