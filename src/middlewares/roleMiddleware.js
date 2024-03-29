import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async ({ fastify, accessLevel }) => {
    try {
        const userRoles = await prisma.role.findMany({
            where: { id: { in: fastify.request.user.roles } },
        });

        if (!((userRoles.filter(role => role.access_level >= accessLevel)).length)) {
            fastify.reply.code(403).send();
            return false;
        }
    } catch (error) {
        console.error(error.toString());
        return fastify.reply.code(500).send();
    }
}