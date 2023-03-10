import { authController } from '../controllers/authController.js'

export default (fastify, opts, done) => {
    fastify.post('/auth/login', authController.login);
    fastify.get('/auth/logout', authController.logout);
    done();
}