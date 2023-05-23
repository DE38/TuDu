const express = require('express')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken")
const JWTmiddleware = require("./jwt_auth_middleware")


const pool = require("./db.js")

const app = express()

app.use(bodyParser.json());
app.use(cookieParser());
app.use(JWTmiddleware);


let email, token;

app.use((req, res, next) => {
    email = req.body.email;

    next();
})

//Tasks

// Get all tasks by USER_ID
module.exports = app.get('/v1/tasks/', async (req, res) => { //TODO BUG
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from tasks WHERE user_id = $1', [userId]);
        res.status(200).send({tasks: queryResponse.rows});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

// Get all tasks by LIST_ID
module.exports = app.get('/v1/list/:list_id/tasks/', async (req, res) => { //TODO BUG
    try {
        const listId = req.params.list_id;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from tasks WHERE user_id = $1 AND list_id = $2', [userId, listId]);
        res.status(200).send({tasks: queryResponse.rows});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

// Get single task of list
module.exports = app.get('/v1/list/:list_id/task/:task_id', async (req, res) => {
    try {
        const taskId = req.params.task_id;
        const listId = req.params.list_id;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from tasks WHERE task_id = $1 AND user_id = $2 AND list_id = $3', [taskId, userId, listId]);
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

// Create new Task
module.exports = app.post('/v1/tasks/', async (req, res) => { //TODO reoccuring rule option
    try {
        const {title, list_id, isEditable, isCompleted, dueDate, contents} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('INSERT INTO tasks (user_id, list_id, title, isEditable, isCompleted, dueDate, contents) VALUES ($1, $2, $3, $4, $5, $6, $7)', [userId, list_id, title, isEditable, isCompleted, dueDate, contents]);
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

// Update single Task by task and list ID
module.exports = app.patch('/v1/list/:list_id/task/:task_id', async (req, res) => {
    try {
        const {title, isCompleted, dueDate, contents} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const taskId = req.params.task_id;
        const listId = req.params.list_id;
        const queryResponse = await pool.query('UPDATE tasks SET title = $4, isCompleted = $5, dueDate = $6, contents = $7 WHERE user_id = $1 AND list_id = $2 AND task_id = $3', [userId, listId, taskId, title, isCompleted, dueDate, contents]);
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

// mark Task as checked
module.exports = app.patch('/v1/list/:list_id/task/:task_id/check', async (req, res) => {
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const taskId = req.params.task_id;
        const listId = req.params.list_id;
        
        // get specified task
        const taskStatusResponse = await pool.query('SELECT * from tasks WHERE task_id = $1 AND user_id = $2 AND list_id = $3', [taskId, userId, listId]);
        const taskStatus = !taskStatusResponse.rows[0].iscompleted;
        const queryResponse = await pool.query('UPDATE tasks SET isCompleted = $4 WHERE user_id = $1 AND list_id = $2 AND task_id = $3', [userId, listId, taskId, taskStatus]);
        if (queryResponse.rowCount === 1) {
            res.status(200).send({text: `Task ${taskId} has been set to ${taskStatus}.`});
        } else {
            res.status(500).send({text: 'could not find a task matching this ID'});
        }
    } catch (err) {
        res.status(500).send({text: err});
    }
})

// Delete task by task and list ID
module.exports = app.delete('/v1/list/:list_id/task/:task_id', async (req, res) => {
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const taskId = req.params.task_id;
        const listId = req.params.list_id;
        const queryResponse = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND list_id = $2 AND task_id = $3', [userId, listId, taskId]);
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

// Get all lists of user
module.exports = app.get('/v1/list/', async (req, res) => {
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const queryResponse = await pool.query('SELECT * from list WHERE user_id = $1', [userId]);
        res.status(200).send({lists: queryResponse.rows});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

// Get single list by list ID
module.exports = app.get('/v1/list/:list_id', async (req, res) => {
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const listId = req.params.list_id;
        const queryResponse = await pool.query('SELECT * from list WHERE user_id = $1 AND list_id = $2', [userId, listId]);
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

// Create new list
module.exports = app.post('/v1/list/', async (req, res) => {
    try {
        const {list_name} = req.body;
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

// Update list by list ID
module.exports = app.patch('/v1/list/:list_id', async (req, res) => {
    try {
        const {list_name} = req.body;
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.list_id;
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

// Delete list by list ID
module.exports = app.delete('/v1/list/:list_id', async (req, res) => {
    try {
        const idResponse = await pool.query('SELECT user_id from users WHERE email = $1', [email]);
        const userId = idResponse.rows[0].user_id;
        const reqId = req.params.list_id;
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
