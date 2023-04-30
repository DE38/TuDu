const express = require('express')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken")

const pool = require("./db.js")

const app = express()

app.use(bodyParser.json());
app.use(cookieParser());

// MIDDLEWARES
app.use(async (req, res, next) => {
    const {token} = req.body;
    const decodedToken = jwt.decode(token);
    const email = decodedToken.auth.email.email
    const privateKey = (await pool.query('SELECT private_key FROM users WHERE email = $1', [email])).rows[0].private_key
    try {
        const verify_res = jwt.verify(token, privateKey)
        next()
    } catch (e) {
        res.status(401).send('Invalid JWT signature');
    }
});


//USER


module.exports = app.get('/v1/getUser', async (req, res) => {
    // const auth_token_req = req.cookies['auth_token'];
    // try {
    //     const email = (await pool.query('SELECT email FROM users WHERE auth_token = $1', [auth_token_req])).rows[0].auth_token;
    //     res.status(200).send({ email: `${email}`});
    // } catch (err) {
    //     console.error("HERE", err.message);
    //     res.status(500).send();
    // }
    res.status(200).send({ email: 'Niklas' });
})

//Tasks
module.exports = app.get('/v1/tasks/', async (req, res) => { //TODO BUG
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from tasks WHERE user_id = $1', [userId]);
        res.status(200).send({tasks: queryResponse.rows});

    } catch (err) {
        console.error(err.message);
        res.status(500).send()

    }
})

module.exports = app.get('/v1/tasks/:id', async (req, res) => {
    try {
        const {email} = req.body;
        const reqId = req.params.id;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from tasks WHERE task_id = $1 AND user_id = $2', [reqId, userId]);
        if (queryResponse.rowCount === 1) {
            res.status(200).send({task: queryResponse.rows[0]});
        } else {
            res.status(500).send({text: 'could not find a task matching this ID'});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send();
    }
})

module.exports = app.post('/v1/tasks/', async (req, res) => {
    try {
        const {email, title} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('INSERT INTO tasks (title, user_id) VALUES ($1, $2)', [title, userId]);
        if (queryResponse.rowCount === 1) {
            res.status(201).send({text: `A task has been created succesfully.`});
        } else {
            res.status(500).send({text: `Internal server error, task could not be created`});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.patch('/v1/tasks/:id', async (req, res) => {
    try {
        const {email, title} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query('UPDATE tasks SET title = $1 WHERE user_id = $2 AND task_id = $3', [title, userId, reqId]);
        if (queryResponse.rowCount===1){
            res.status(200).send({text: `The task has been updated successfully.`});
        } else {
            res.status(500).send({text: 'could not find a task matching this ID'});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.delete('/v1/tasks/:id', async (req, res) => {
    try {
        const {email, title} = req.body; //TODO perhaps check for title as well
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND task_id = $2', [userId, reqId]);
        if (queryResponse.rowCount===1){
            res.status(200).send({text: `A Task has been deleted successfully.`});
        } else {
            res.status(500).send({text: 'could not find a task matching this ID'});
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

//Lists
module.exports = app.get('/v1/list/', async (req, res) => {
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from list WHERE user_id = $1', [userId]);
        res.status(200).send({lists: queryResponse.rows});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.get('/v1/list/:id', async (req, res) => {
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query('SELECT * from list WHERE user_id = $1 AND list_id = $2', [userId, reqId]);
        if (queryResponse.rowCount === 1){
            res.status(200).send({list: queryResponse.rows[0]});
        } else {
            res.status(400).send({text: 'no list found with that id.'});
        }
        } catch (err) {
        console.error(err.message);
        res.status(500).send();
    }
})

module.exports = app.post('/v1/list/', async (req, res) => {
    try {
        const {email, list_name} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('INSERT INTO list (user_id, list_name) VALUES ($1, $2)', [userId, list_name]);
        if (queryResponse.rowCount === 1){
            res.status(201).send({text: `list has been created`});
        } else {
            res.status(400).send({text: 'no list found with that id'});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.patch('/v1/list/:id', async (req, res) => {
    try {
        const {email, list_name} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query(`UPDATE list SET list_name = $1 WHERE user_id = $2 AND list_id = $3`, [list_name, userId, reqId]);
        if (queryResponse.rowCount === 1){
            res.status(200).send({text: `list has been updated`});
        } else {
            res.status(400).send({text: 'no list found with that id'});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.delete('/v1/list/:id', async (req, res) => {
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query('DELETE FROM list WHERE user_id = $1 AND list_id = $2', [userId, reqId]);
        if (queryResponse.rowCount === 1){
            res.status(200).send({text: `list has been deleted`});
        } else {
            res.status(400).send({text: 'no list found with that id'});
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})