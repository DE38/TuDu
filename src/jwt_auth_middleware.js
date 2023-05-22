const jwt = require("jsonwebtoken")
const pool = require("./db.js")

async function JWTmiddleware(req, res, next) {
    let token = null;
    let privateKey = null;
    try {
        token = req.body.token;
        if (!token) {
            token = req.headers['token'];
        }
        const decodedToken = jwt.decode(token);
        const email = decodedToken.auth.email.email
        privateKey = (await pool.query('SELECT private_key FROM users WHERE email = $1', [email])).rows[0].private_key
        try {
            const verify_res = jwt.verify(token, privateKey)
            req.body.email = email
            next();
        } catch (e) {
            res.status(401).send('Invalid JWT signature');
        }
    } catch (e) {
        res.status(401).send('no JWT found in the request body.')
    }
}

module.exports = JWTmiddleware