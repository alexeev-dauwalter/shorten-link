import { AuthController } from '../controllers/authController.js';

export default (fastify, opts, done) => {
    fastify.post('/auth/login', AuthController.login);
    fastify.get('/auth/logout', AuthController.logout);
    done();
}