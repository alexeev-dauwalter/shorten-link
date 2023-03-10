import { linkController } from '../controllers/linkController.js'
import apiMiddleware from '../middlewares/apiMiddleware.js'

export default (fastify, opts, done) => {
    fastify.addHook('preHandler', async (request, reply) => {
        if (!(['/:hash', '/:hash/qr'].includes(request.routeConfig.url))) {
            await apiMiddleware(request, reply);
        }
    })

    fastify.get('/links', linkController.getAll);
    fastify.post('/link', linkController.create);
    fastify.get('/:hash', linkController.redirect);
    fastify.get('/@:hash', linkController.information);
    fastify.put('/:hash', linkController.update);
    fastify.delete('/:hash', linkController.delete);
    fastify.get('/:hash/qr', linkController.generateQR);
    done();
}
