import { PrismaClient as userPrisma } from '../../../prisma/generated/client1/index.js';
import { PrismaClient as playerPrisma } from '../../../prisma/generated/client2/index.js';
import { PrismaClient as matchPrisma } from '../../../prisma/generated/client3/index.js';

export const userPrisma = new userPrisma({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

export const playerPrisma = new playerPrisma({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

export const matchPrisma = new matchPrisma({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});
