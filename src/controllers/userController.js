import { PrismaClient } from '@prisma/client';
import { User } from '../models/User.js';

const prisma = new PrismaClient();

export class UserController {
    static #selectQuery = {
        id: true,
        username: true,
        login: true,
        token: true,
        created_at: true,
        updated_at: true,
        roles: true
    }

    static async get(req, res) {
        try {
            const users = await prisma.user.findMany({
                select: UserController.#selectQuery
            });

            users.map(user => {
                return new User(user).toJSON();
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
                candidate = await prisma.user.findFirst({ select: UserController.#selectQuery, where: { login } });

            if (candidate) return res.code(409).send();

            const newUser = new User({ username, login, password, roles: roles || [] }),
                query = await prisma.user.create({
                    data: Object.assign(
                        newUser.toJSON(),
                        { 
                            password: newUser.password,
                            created_at: newUser.createdAt,
                            updated_at: newUser.updatedAt
                        },
                        {
                            role: {
                                connect: newUser.roles.size ?
                                    Array.from(newUser.roles) :
                                    await prisma.role.findMany({
                                        select: { id: true },
                                        where: { is_default: true }
                                    })
                            }
                        }
                    )
                });

            return res.send(new User(query).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async getInfo(req, res) {
        try {
            const { userLogin } = req.params;
            let user = await prisma.user.findFirst({ select: UserController.#selectQuery, where: { login: userLogin } });

            if (!user) return res.status(404).send();

            return res.send(new User(user).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async update(req, res) {
        try {
            const { userLogin } = req.params,
                { username, login, password, roles, token } = req.body;

            let data = await prisma.user.findFirst({ select: UserController.#selectQuery, where: { login: userLogin } });

            if (!data) return res.code(404).send();

            if (!username && !login && !password && !roles && !token) return res.code(400).send();

            const user = new User({
                username: username ?? data.username,
                login: login ?? data.login,
                password: password ?? null,
                roles: roles || [],
                updated_at: new Date()
            });

            // FIXME
            const query = await prisma.user.update({
                where: { login: userLogin },
                data: Object.assign(
                    {
                        username: user.username,
                        login: user.login,
                        password: user.password,
                        created_at: user.createdAt,
                        updated_at: user.updatedAt
                    },
                    {
                        role: {
                            set: user.roles.size ? Array.from(user.roles) : data.roles,
                        }
                    }
                )
            });
        
            if (!query) return res.code(500).send();

            data = await prisma.user.findFirst({ select: UserController.#selectQuery, where: { login: userLogin } });
            
            return res.send(new User(data).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async delete(req, res) {
        try {
            const { userLogin } = req.params,
                user = await prisma.user.findFirst({ select: UserController.#selectQuery, where: { login: userLogin } });

            if (!user) return res.status(404).send();

            await prisma.link.deleteMany({ where: { owner: userId } });
            await prisma.user.delete({ where: { login: userLogin } });

            return res.send(new User(user).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }
}