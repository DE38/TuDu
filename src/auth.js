const express = require('express')
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
        const pw_hash_from_db = (await pool.query('SELECT pw_hash FROM users WHERE email = $1', [email])).rows[0].pw_hash;
        if(bcrypt.compare(passwd, pw_hash_from_db)){
            await pool.query('UPDATE users SET auth_token = $1 WHERE email = $2', ['auth_test_token', email]);
            await pool.query('UPDATE users SET refresh_token = $1 WHERE email = $2', ['refresh_test_token', email]);
            res.status(200);
            res.cookie('auth_token', 'auth_test_token');
            res.cookie('refresh_token', 'refresh_test_token');
            res.json({text: `The user has been authentificated. Your Tokens are in the sent cookies.`});
        } else {
            res.status(401);
            res.send();
        }


    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})
