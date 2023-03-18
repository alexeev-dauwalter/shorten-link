import jwt from 'jsonwebtoken';

export default (req, res, done) => {
    if (req.method === 'OPTIONS') return done();

    try {
        const { session } = req?.cookies;

        if (!session) return false;

        req.user = jwt.verify(session, process.env.JWT_SECRET_KEY);
    } catch (error) {
        console.error(error.toString());
        return false;
    }
}