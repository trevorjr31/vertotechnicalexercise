const mysql = require("mysql");

const sqlhost = process.env.MYSQL_HOST || "db:3306";
const sqluser = process.env.MYSQL_USER || "root";
const sqlpass = process.env.MYSQL_PASS || PASSWORD;
const sqldb = process.env.MYSQL_DB || "vertoex";

const mysqlConnection = mysql.createConnection({
  host: sqlhost,
  port: 3306,
  user: sqluser,
  password: sqlpass,
  database: sqldb,
  multipleStatements: true,
});

mysqlConnection.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("sql connection established");
  }
});

module.exports = mysqlConnection;
