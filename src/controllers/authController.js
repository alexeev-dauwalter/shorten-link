import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // TODO: Заменить на @fastify/jwt
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
    static async login(req, res) {
        try {
            const { login, password } = req.body,
                data = await prisma.user.findFirst({ where: { login } });

            if (!data || !bcrypt.compareSync(password, data.password)) {
                // TODO: Найти HTTP код
                return res.send({ success: false, error_code: 'user_not_found', error_message: 'Неверный логин или пароль' });
            }

            const token = jwt.sign(
                {
                    login: data.login,
                    iss: process.env.SERVER_HOSTNAME,
                    iat: Date.now()
                },
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn: process.env.JWT_ALIVE_TIME
                }
            );

            return res.setCookie('session', token, {
                domain: process.env.SERVER_HOSTNAME,
            }).send({ success: true });
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async logout(req, res) {
        try {
            return res.clearCookie('session', {
                domain: process.env.SERVER_HOSTNAME,
            }).send({ success: true });
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }
}