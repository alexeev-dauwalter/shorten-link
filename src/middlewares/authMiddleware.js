export default async (req, res, done) => {
    if (req.method === 'OPTIONS') return done();

    try {
        const { session } = req?.cookies;

        if (!session) return false;

        req.user = await req.jwtVerify(session, process.env.JWT_SECRET_KEY);
    } catch (error) {
        console.error(error.toString());
        return res.status(500).send();
    }
}