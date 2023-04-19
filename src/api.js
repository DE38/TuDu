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
        console.log(auth_token_db + ";" + auth_token_req)
        if(auth_token_db != auth_token_req) {
            console.error('wrong login credentials')
            res.status(400).send({text: 'Your access token is invalid'});
        }
    } catch {
        console.error('No matching credentials found. Ensure you are registered and logged in.');
    }
    next();
});


//USER

module.exports = app.get('/v1/logout', async (req, res) => {
    const {email} = req.body;
    try {
        await pool.query('UPDATE users SET auth_token = null WHERE email = $1', [email]);
        await pool.query('UPDATE users SET refresh_token = null WHERE email = $1', [email])
        res.status(200).send({text: `You have been logged out. Your JWTs are now invalid.`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

//Tasks
module.exports = app.get('/v1/tasks/', async (req, res) => { //TODO BUG
    try {
        const {email} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        await pool.query('SELECT * from tasks WHERE user_id = $1', [userId]);
        res.status(200).send({test: "This is the placeholder for read all tasks"});
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
        res.status(200).send({text: `This is the placeholder for read task by id, id = ${reqId}`});
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
        await pool.query('INSERT INTO tasks (title, user_id) VALUES ($1, $2)', [title, userId]);
        res.status(200).send({text: `A task has been created succesfully.`});
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
        await pool.query('UPDATE tasks SET title = $1 WHERE user_id = $2 AND task_id = $3', [title, userId, reqId]);
        res.status(200).send({text: `A Task has been updated successfully.`});
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
        await pool.query('DELETE FROM tasks WHERE user_id = $1 AND task_id = $2', [userId, reqId]);
        res.status(200).send({text: `A Task has been deleted successfully.`});
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
        await pool.query('SELECT * from reoccurring WHERE user_id = $1', [userId]);
        res.status(200).send({test: "This is the placeholder for list all tasks"});
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
        await pool.query('SELECT * from reoccurring WHERE user_id = $1 AND reoccurring_id = $2', [userId, reqId]);
        res.status(200).send({text: `This is the placeholder for get a single reoccuring`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

module.exports = app.post('/v1/list/', async (req, res) => {
    try {
        const {email, rule_string} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        await pool.query('INSERT INTO reoccurring (user_id, rule_string) VALUES ($1, $2)', [userId, rule_string]);
        res.status(200).send({text: `This is the placeholder for creating a reoccuring.`});
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
        await pool.query(`UPDATE reoccurring SET rule_string = $1 WHERE user_id = $2 AND reoccurring_id = $3`, [rule_string, userId, reqId]);
        res.status(200).send({text: `This is the placeholder for updating a reoccuring.`});
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
        await pool.query('DELETE FROM reoccurring WHERE user_id = $1 AND reoccurring_id = $2', [userId, reqId]);
        res.status(200).send({text: `This is the placeholder for deleting a reoccuring by id`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})