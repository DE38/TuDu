const express = require('express')
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require('crypto');

const pool = require("./db.js")


const app = express()

app.use(bodyParser.json());


module.exports = app.post('/v1/register', async (req, res) => {
    try {
        let {email, passwd} = req.body;
        if (email === undefined || passwd === undefined){
            res.status(400);
            res.send({text: `email or password is missing`});
        }
        try {
            await pool.query('INSERT INTO users (email, pw_hash) VALUES ($1, $2)', [email, passwd]);
        } catch {
            res.status(400);
            res.send({text: `this email has already been registered!`});
        }
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                //                    cipher: 'aes-256-cbc', //TODO vllt machen wegen DB?
                //                    passphrase: 'top secret'
            }
        });
        await pool.query('UPDATE users SET private_key = $1 WHERE email = $2', [privateKey, email])
        res.status(201);
        res.send({text: `You have been registered!`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }

})

module.exports = app.post('/v1/login', async (req, res) => {
    try {
        const {email, passwd} = req.body;
        if (email === undefined || passwd === undefined){
            res.status(400);
            res.send({text: `email or password is missing`});
        }
        const pw_hash_from_db = (await pool.query('SELECT pw_hash FROM users WHERE email = $1', [email])).rows[0].pw_hash;
        if(bcrypt.compare(passwd, pw_hash_from_db)){
            const privateKey =  (await pool.query('SELECT private_key FROM users WHERE email = $1', [email])).rows[0].private_key
            const auth = {email: {email}};
            jwt.sign({ auth }, privateKey, (err, token) => {
                if (err) {
                    res.status(500).send({ error: 'Error creating JWT' });
                } else {
                    // Send JWT to client in response
                    res.send({ token });
                }
            })

//            res.status(200);
//            res.cookie('auth_token', 'auth_test_token');
//            res.cookie('refresh_token', 'refresh_test_token');
//            res.json({text: `The user has been authentificated. Your Tokens are in the sent cookies.`});
        } else {
            res.status(401);
            res.send();
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

//module.exports = app.get('/v1/logout', async (req, res) => { //TODO decide on what to do here
//    const {email} = req.body;
//    try {
//        await pool.query('UPDATE users SET auth_token = null WHERE email = $1', [email]);
//        await pool.query('UPDATE users SET refresh_token = null WHERE email = $1', [email])
//        res.status(200).send({text: `You have been logged out. Your JWTs are now invalid.`});
//    } catch (err) {
//        console.error(err.message);
//        res.status(500).send()
//    }
//})

module.exports = app.post('/v1/jwttest', async (req, res) => { //TODO to be removed for final submission
    const user = {
        id: 123,
        username: 'john_doe',
        email: 'john_doe@example.com'
    };

    jwt.sign({ user }, 'secretKey', (err, token) => {
        if (err) {
            res.status(500).send({ error: 'Error creating JWT' });
        } else {
            res.send({ token });
        }
    });
})

module.exports = app.post('/v1/jwtecho', async  (req, res) => {
    const {token} = req.body;
    const decodedToken = jwt.decode(token);
    const email = decodedToken.auth.email.email
    const privateKey = (await pool.query('SELECT private_key FROM users WHERE email = $1', [email])).rows[0].private_key
    try {
        const verify_res = jwt.verify(token, privateKey)
        res.send(verify_res)
    } catch (e) {
        res.status(401).send('Invalid JWT signature');
    }
})

module.exports = app.post('/v1/getUser', async (req, res) => {
    const {auth_token} = req.body;
    try {
        const email = (await pool.query('SELECT email FROM users WHERE auth_token = $1', [auth_token])).rows[0].email;
        res.status(200).send({ email: `${email}`});
    } catch (err) {
        console.error("HERE", err.message);
        res.status(500).send();
    }
})
