import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
    static async login(req, res) {
        try {
            const { login, password } = req.body,
                data = await prisma.user.findFirst({ where: { login } });

            if (!data || !bcrypt.compareSync(password, data.password)) return res.code(404).send();

            const token = await res.jwtSign({
                login: data.login,
                iss: process.env.SERVER_HOSTNAME,
                iat: Date.now()
            });

            return res.setCookie('session', token, {
                domain: process.env.SERVER_HOSTNAME,
            }).send();
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async logout(req, res) {
        try {
            return res.clearCookie('session', {
                domain: process.env.SERVER_HOSTNAME,
            }).send();
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }
}