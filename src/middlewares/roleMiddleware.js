import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async ({ fastify, need_value }) => {
    try {
        const userRoles = await prisma.role.findMany({
            where: { id: { in: fastify.request.user.roles } },
        });

        if (!((userRoles.filter(role => role.value >= need_value)).length)) {
            return fastify.reply.code(403).send();
        }
    } catch (error) {
        console.error(error.toString());
        return fastify.reply.code(500).send();
    }
}