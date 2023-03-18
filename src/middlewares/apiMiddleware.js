import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
    if (req.method === 'OPTIONS') return res.send();

    const Unauthorized = {
        success: false,
        error_code: 'unauthorized',
        error_message: 'Пользователь не авторизирован'
    };

    try {
        let token = req.cookies?.session || req.headers?.authorization ? ((req.headers?.authorization).split(' '))[1] : null,
            user = false;

        if (!token) return res.status(401).send(Unauthorized);

        const tokenType = token[1].split('.');

        switch (tokenType.length) {
            case 3: // JWT-Token
                const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

                if (!decodedData) {
                    return res.status(401).send(Unauthorized);
                }

                user = await prisma.user.findFirst({ where: { login: decodedData.login } });
                break;
            case 1: // API-Token
                user = await prisma.user.findFirst({ where: { token } });
                break;

            default:
                return res.status(401).send(Unauthorized);
        }

        if (!user) return res.status(401).send(Unauthorized);

        user.roles = user.roleId;
        delete user.roleId;

        req.user = user;
    } catch (error) {
        console.error(error.toString());
        return res.status(401).send(Unauthorized);
    }
}