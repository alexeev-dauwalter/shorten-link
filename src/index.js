// Импорты
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import Router from './routers/index.js';

// Подгрузка .env файла в process.env
dotenv.config();

// Указание порта сервера в соответствии с настройками рабочей среды
const PORT = process.env.SERVER_PORT || 3000;

// Развёртывание инстанции сервера
const fastify = Fastify({
    logger: process.env.SERVER_LOGGER === 'true' || false
});

// Регистрация модулей под fastify
fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET_KEY
});
fastify.register(jwt, {
    secret: process.env.JWT_SECRET_KEY,
    sign: {
        expiresIn: process.env.JWT_ALIVE_TIME
    }
})

fastify.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
});
fastify.register(cors, {
    origin: true // FIXME
});

// Регистрация роутеров
fastify.register(Router);

// Старт сервера
await fastify.listen({
    port: PORT,
    https: process.env.SERVER_HTTPS_MODE === 'true' ? {
        key: readFileSync(process.env.SERVER_CA_KEY_PATH),
        cert: readFileSync(process.env.SERVER_CA_CERT_PATH)
    } : null
}, (error, address) => {
    if (error) {
        fastify.log.error(error);
        process.exit(1);
    }
    console.log(`[ * ] Server is now listening on ${address}`);
});