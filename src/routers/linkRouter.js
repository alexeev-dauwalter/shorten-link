import { LinkController } from '../controllers/linkController.js';
import apiMiddleware from '../middlewares/apiMiddleware.js';

export default (fastify, opts, done) => {
    fastify.addHook('preHandler', async (request, reply) => {
        const { url, method } = request.routeConfig,
            allowedRouters = [
                { url: '/:hash', method: 'GET' },
                { url: '/:hash/qr', method: 'GET' }
            ];

        if (!(allowedRouters.filter(route => url == route.url && method == route.method)).length) {
            await apiMiddleware(request, reply);
        }
    })

    fastify.get('/links', LinkController.getAll);
    fastify.post('/link', LinkController.create);
    fastify.get('/:hash', LinkController.redirect);
    fastify.get('/@:hash', LinkController.information);
    fastify.put('/:hash', LinkController.update);
    fastify.delete('/:hash', LinkController.delete);
    fastify.get('/:hash/qr', LinkController.generateQR);
    done();
}
