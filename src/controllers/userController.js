import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import randomString from '../utils/randomString.js';

const prisma = new PrismaClient();

export class UserController {
    static async get(req, res) {
        try {
            const users = await prisma.user.findMany({}); 
            
            users.map(user => {
                user = UserController.reformatData(user);
            });

            return res.send(users);
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async create(req, res) {
        try {
            const { username, login, password, roles } = req.body,
                candidate = await prisma.user.findFirst({ where: { login } });

            if (candidate) return res.code(409).send();

            const newUser = await prisma.user.create({
                data: {
                    username,
                    login,
                    password: bcrypt.hashSync(password, 7),
                    token: randomString({}),
                    roles: {
                        connect: roles ?
                            roles.map(role => { return { id: role } }) :
                            await prisma.role.findMany({
                                select: { id: true },
                                where: { default: true }
                            })
                    }
                }
            });

            return res.send(UserController.reformatData(newUser));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async getInfo(req, res) {
        try {
            const { userId } = req.params;
            let user = await prisma.user.findFirst({ where: { id: userId } });

            if (!user) return res.status(404).send();

            user = UserController.reformatData(user);

            return res.send(user);
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async update(req, res) {
        try {
            const { userId } = req.params,
                { username, login, password, roles, token } = req.body;

            let data = await prisma.user.findFirst({ where: { id: userId } });

            if (!data) return res.code(404).send();

            if (!username && !login && !password && !roles && !token) return res.code(400).send();

            const query = await prisma.user.update({
                where: { id: userId },
                data: {
                    username: username ?? data.username,
                    login: login ?? data.login,
                    password: password ? bcrypt.hashSync(password, 7) : data.password,
                    token: token ?? data.token,
                    roles: {
                        set: roles ? roles.map(role => { return { id: role } }) : data.roles,
                    },
                    updated_at: new Date()
                }
            });

            if (!query) return res.code(500).send();

            data = await prisma.user.findFirst({ where: { id: userId } });

            return res.send(UserController.reformatData(data));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async delete(req, res) {
        try {
            const { userId } = req.params,
                user = await prisma.user.findFirst({ where: { id: userId } });

            if (!user) return res.status(404).send();

            await prisma.link.deleteMany({ where: { owner: userId } });
            await prisma.user.delete({ where: { id: userId } });

            return res.send(UserController.reformatData(user));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static reformatData(data) {
        if (data.created_at) data.created_at = new Date(data.created_at).getTime();
        if (data.updated_at) data.updated_at = new Date(data.updated_at).getTime();

        if(data.roleId) {
            data.roles = data.roleId;

            delete data.roleId;
            delete data.password;
        }

        return data;
    }
}