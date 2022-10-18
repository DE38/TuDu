// ./src/index.js

// libraries
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


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
app.get('/', (req, res) => {
    res.status(200).send({test: "Hello World!"});
})

// if none of the above defined endpoints is accessed, error 404 is thrown
app.use((req, res) => res.status(404).send());

// if any error happens during the call process, error 500 is thrown
app.use((err, req, res, next) => res.status(500).send());

// starting the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})