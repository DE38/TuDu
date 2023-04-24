const express = require('express')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const pool = require("./db.js")

const app = express()

app.use(bodyParser.json());
app.use(cookieParser());

// MIDDLEWARES
app.use(async (req, res, next) => {
    try {
        const {email} = req.body;
        const auth_token_req = req.cookies['auth_token'];
        const auth_token_db = (await pool.query('SELECT auth_token FROM users WHERE email = $1', [email])).rows[0].auth_token;
//        console.log(auth_token_db + ";" + auth_token_req)
        if(auth_token_db != auth_token_req) {
            console.error('wrong login credentials')
            res.status(400).send({text: 'Your access token is invalid'});
        }
        next();
    } catch {
        res.status(500).send({text: 'Internal Server Error'});
        console.error('No matching credentials found. Ensure you are registered and logged in.');
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
        const {email, title} = req.body;
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

//Lists/ reoccuring
module.exports = app.get('/v1/list/', async (req, res) => {
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from reoccurring WHERE user_id = $1', [userId]);
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
        const queryResponse = await pool.query('SELECT * from reoccurring WHERE user_id = $1 AND reoccurring_id = $2', [userId, reqId]);
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
        const {email, rule_string} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('INSERT INTO reoccurring (user_id, rule_string) VALUES ($1, $2)', [userId, rule_string]);
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
        const {email, rule_string} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.id;
        const queryResponse = await pool.query(`UPDATE reoccurring SET rule_string = $1 WHERE user_id = $2 AND reoccurring_id = $3`, [rule_string, userId, reqId]);
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
        const queryResponse = await pool.query('DELETE FROM reoccurring WHERE user_id = $1 AND reoccurring_id = $2', [userId, reqId]);
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