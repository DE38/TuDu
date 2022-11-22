const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "192.168.0.100",
    port: 5432,
    database: "postgres"

});

module.exports = pool;

//     host: "192.168.0.100",
