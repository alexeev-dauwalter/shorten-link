import linkRouter from './linkRouter.js';
import authRouter from './authRouter.js';
import userRouter from './userRouter.js';

export default (fastify, opts, done) => {
    fastify.register(userRouter);
    fastify.register(authRouter);
    fastify.register(linkRouter);
    done();
}