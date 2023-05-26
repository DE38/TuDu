// ./src/index.js

// libraries
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


const auth = require("./auth.js")
const api = require("./api.js")

const pool = require("./db.js")



// defaults
const port = 8080

const app = express();
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth', auth);
app.use('/api', api)


// QUERIES

const USERS = `users (
    user_id serial UNIQUE, 
    email varchar(255) NOT NULL UNIQUE, 
    pw_hash varchar(255) NOT NULL, 
    private_key varchar(5000),
    PRIMARY KEY (user_id)
)`;

const TASKS = `tasks (
    user_id integer NOT NULL, 
    task_id serial UNIQUE, 
    list_id integer NOT NULL, 
    title varchar(48) NOT NULL, 
    reoccuring_rule varchar(16), 
    isEditable BOOLEAN, 
    isCompleted BOOLEAN,
    dueDate DATE DEFAULT CURRENT_DATE, 
    creationDate DATE DEFAULT CURRENT_DATE, 
    contents varchar(256), 
    PRIMARY KEY (user_id, task_id, list_id),
    CONSTRAINT link_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT link_list
        FOREIGN KEY (list_id, user_id)
        REFERENCES list (list_id, user_id)
        ON DELETE CASCADE 
        ON UPDATE CASCADE
)`;

const LIST = `list (
    user_id integer NOT NULL, 
    list_id serial UNIQUE, 
    list_name varchar(255) NOT NULL,
    PRIMARY KEY (user_id, list_id),
    CONSTRAINT link_user
        FOREIGN KEY (user_id) 
        REFERENCES users (user_id)
        ON DELETE CASCADE 
        ON UPDATE CASCADE
)`;

// ENDPOINTS

// redirect to base path
app.get('/', (req, res) => {
    res.redirect(301, '/api/v1/hello_world');
});


//reset DB for simpler developement, to be removed after developement
app.post('/tools/v1/reset_db', async (req, res) => {

    try {
        await pool.query("DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP EXECUTE 'DROP TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$;");

        await pool.query("CREATE TABLE " + USERS);
        await pool.query("CREATE TABLE " + LIST);
        await pool.query(`CREATE INDEX email_index_list ON list(user_id)`);
        await pool.query("CREATE TABLE " + TASKS);
        await pool.query(`CREATE INDEX email_index_tasks ON tasks(user_id)`);
        res.status(200).send({ text: `Thank you for resetting DB today` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send()
    }

})

// if none of the above defined endpoints is accessed, error 404 is thrown
app.use((req, res) => res.status(404).send());


// starting the server
app.listen(port, async () => {

    try {
        await pool.query("CREATE TABLE IF NOT EXISTS " + USERS);
        await pool.query(`CREATE TABLE IF NOT EXISTS ` + LIST);
        await pool.query(`CREATE INDEX IF NOT EXISTS email_index_list ON list(user_id)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS ` + TASKS);
        await pool.query(`CREATE INDEX IF NOT EXISTS email_index_tasks ON tasks(user_id)`);
        console.log(`Thank you for initializing DB today`);
    } catch (err) {
        console.log(err)
    }
    console.log(`Server listening on port ${port}`);

})

