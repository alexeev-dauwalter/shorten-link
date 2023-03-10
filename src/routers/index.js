import linkRouter from './linkRouter.js'
import authRouter from './authRouter.js'

export default (fastify, opts, done) => {
    fastify.register(authRouter);
    fastify.register(linkRouter);
    done();
}