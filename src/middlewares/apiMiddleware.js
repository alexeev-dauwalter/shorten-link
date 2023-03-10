import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export default async (req, res) => {
    if (req.method === 'OPTIONS') return res.send();

    const notAuthorized = {
        success: false,
        error_code: 'not_authorized',
        error_message: 'Пользователь не авторизирован'
    };

    try {
        let token = req.cookies?.session || req.headers?.authorization ? ((req.headers?.authorization).split(' '))[1] : null;
        let user = false;

        if (!token) return res.status(403).send(notAuthorized);

        const tokenType = token[1].split('.');

        switch (tokenType.length) {
            case 3: // JWT-Token
                const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

                if (!decodedData) {
                    return res.status(403).send(notAuthorized);
                }

                [user] = await prisma.user.findMany({ where: { login: decodedData.login } });
                break;
            case 1: // API-Token
                [user] = await prisma.user.findMany({ where: { token } });
                break;

            default:
                return res.status(403).send(notAuthorized);
        }

        if (!user) return res.status(403).send(notAuthorized);

        req.user = user;
    } catch (error) {
        console.log(error.toString());
        return res.status(403).send(notAuthorized);
    }
}