import { UserController } from '../controllers/userController.js';
import apiMiddleware from '../middlewares/apiMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

export default (fastify, opts, done) => {
    fastify.addHook('preHandler', async (request, reply) => {
        await apiMiddleware(request, reply);
        await roleMiddleware({
            fastify: { request, reply },
            need_value: 100
        });
    });

    fastify.get('/users/', UserController.get);
    fastify.post('/users/', UserController.create);
    fastify.get('/users/:userId/', UserController.getInfo);
    fastify.put('/users/:userId/', UserController.update);
    fastify.delete('/users/:userId/', UserController.delete);
    done();
}
