// ./src/index.js

// libraries
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const pool = require("./db.js")


// defaults
const port = 8080

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));


// MIDDLEWARES
app.use((req, res, next) => {
    console.log("Middleware active!");
    next();
});

// ENDPOINTS

//Hello-world
app.get('/api/v1/hello_world', (req, res) => {
    res.status(200).send({text: 'Hello world!'});
});

//USER
app.post('/api/v1/register', async (req, res) => {
    try {
        const {usr_name} = req.body;
        await pool.query("");
        res.status(200).send({text: `This is the placeholder for register a user`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }

})

app.post('/api/v1/login', (req, res) => {
    res.status(200).send({text: `This is the placeholder for logging in a user`});
})

app.get('/api/v1/logout', (req, res) => {
    res.status(200).send({text: `This is the placeholder for logging out a user`});
})

//Tasks
app.get('/api/v1/tasks/', (req, res) => {
    res.status(200).send({test: "This is the placeholder for read all tasks"});
})

app.get('/api/v1/tasks/:id', (req, res) => {
    const reqId = req.params.id;
    res.status(200).send({text: `This is the placeholder for read task by id, id = ${reqId}`});
})

app.post('/api/v1/tasks/', (req, res) => {
    res.status(200).send({text: `This is the placeholder for read all tasks`});
})

app.patch('/api/v1/tasks/:id', (req, res) => {
    res.status(200).send({text: `This is the placeholder for update task by id`});
})

app.delete('/api/v1/tasks/:id', (req, res) => {
    res.status(200).send({text: `This is the placeholder for delete task by id`});
})

//Lists
app.get('/api/v1/list/', (req, res) => {
    res.status(200).send({test: "This is the placeholder for list all tasks"});
})

app.get('/api/v1/list/:id', (req, res) => {
    const reqId = req.params.id;
    res.status(200).send({text: `This is the placeholder for read list by id, id = ${reqId}`});
})

app.post('/api/v1/list/', (req, res) => {
    res.status(200).send({text: `This is the placeholder for read all lists`});
})

app.patch('/api/v1/list/:id', (req, res) => {
    res.status(200).send({text: `This is the placeholder for update list by id`});
})

app.delete('/api/v1/list/:id', (req, res) => {
    res.status(200).send({text: `This is the placeholder for delete list by id`});
})

//init DB for simpler developement
app.post('/api/v1/init_db', async (req, res) => {
    try {
        await pool.query("CREATE TABLE users (user_id serial NOT NULL PRIMARY KEY ,email varchar(255) NOT NULL,pw_hash varchar(255) NOT NULL)");
        await pool.query("CREATE TABLE lists (list_id serial NOT NULL PRIMARY KEY,title varchar(48) NOT NULL);");
        await pool.query("CREATE TABLE reoccuring (reoccurring_id serial NOT NULL PRIMARY KEY,rule_string varchar(255) NOT NULL);")
        res.status(200).send({text: `Thank you for initializing DB today`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }
})

// if none of the above defined endpoints is accessed, error 404 is thrown
app.use((req, res) => res.status(404).send());


// starting the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})