import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export class authController {
    static async login(req, res) {
        try {
            const { login, password } = req.body,
                data = await prisma.user.findMany({ where: { login } });

            if (!data.length || !bcrypt.compareSync(password, data[0].password)) {
                return res.send({ success: false, error_code: 'user_not_found', error_message: 'Неверный логин или пароль' });
            }

            const token = jwt.sign(
                {
                    login: data[0].login,
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