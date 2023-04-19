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
app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth', auth);
app.use('/api', api)


// ENDPOINTS

// redirect to base path
app.get('/', (req, res) => {
    res.redirect(301, '/api/v1/hello_world');
});


//reset DB for simpler developement, to be removed after developement
app.post('/api/v1/reset_db', async (req, res) => {
    try {
        await pool.query("DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP EXECUTE 'DROP TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$;");

        await pool.query("CREATE TABLE users (user_id serial PRIMARY KEY ,email varchar(255) NOT NULL UNIQUE,pw_hash varchar(255) NOT NULL, auth_token varchar(255), refresh_token varchar(255))");
        await pool.query(`CREATE TABLE tasks(user_id varchar(256), task_id serial PRIMARY KEY,title varchar(48) NOT NULL);`);
        await pool.query(`CREATE INDEX email_index_tasks ON tasks(user_id)`);
        await pool.query(`CREATE TABLE reoccurring(user_id varchar(256), reoccurring_id serial PRIMARY KEY,rule_string varchar(255) NOT NULL)`);
        await pool.query(`CREATE INDEX email_index_reoccuring ON reoccurring(user_id)`);
        res.status(200).send({text: `Thank you for resetting DB today`});
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
        await pool.query("CREATE TABLE IF NOT EXISTS users (user_id serial PRIMARY KEY ,email varchar(255) NOT NULL UNIQUE,pw_hash varchar(255) NOT NULL, auth_token varchar(255), refresh_token varchar(255))");
        await pool.query(`CREATE TABLE IF NOT EXISTS tasks(user_id varchar(256), task_id serial PRIMARY KEY,title varchar(48) NOT NULL);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS email_index_tasks ON tasks(user_id)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS reoccurring(user_id varchar(256), reoccurring_id serial PRIMARY KEY,rule_string varchar(255) NOT NULL)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS  email_index_reoccuring ON reoccurring(user_id)`);
        console.log(`Thank you for initializing DB today`);
    } catch (err){
        console.log(err)
    }
    console.log(`Server listening on port ${port}`);

})

