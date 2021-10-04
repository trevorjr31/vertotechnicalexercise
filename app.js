//Main App File - Verto Health Technical Exercise
const mysql = require("./db");
const express = require("express");
const session = require("express-session");
const mysQLStore = require("express-mysql-session")(session);
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//Express settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const path = __dirname + "/dist/";
app.use(express.static(path));

//settings for express-session
app.use(
  session({
    key: "sessionkey",
    secret: "key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    isAdmin: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 },
  })
);

// set the store location for session data to the mysql db
var sessionStore = new mysQLStore(
  {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "vertoex",
    multipleStatements: true,
  },
  mysql
);

//Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err });
});

//Error Creator
var createError = function (status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
};

//Check if authorized
var isAuth = async function (id) {
  return new Promise(async (resolve, reject) => {
    await mysql.query(
      `SELECT * FROM vertoex.sessions WHERE session_id = '${id}'`,
      (err, resp) => {
        if (err) {
          throw err;
        } else if (resp.length == 0) {
          reject(false);
        } else {
          resolve(true);
        }
      }
    );
  }).catch((e) => {
    throw e;
  });
};

//ping endpoint
app.get("/api/ping", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    var authorized = await isAuth(session);
    if (authorized) {
      res.sendStatus(200);
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

//home endpoint
app.get("/", (req, res) => {
  res.sendFile(path + "index.html");
});

//AUTHENTICATION

//credential check function

var credetialCheck = async function (username, password) {
  return new Promise(async (resolve, reject) => {
    await mysql.query(
      `SELECT * FROM vertoex.users WHERE username = '${username}'`,
      async (err, resp) => {
        if (err) {
          reject(err);
        }
        if (resp.length == 0) {
          const err = await createError(400, "Invalid Credentials");
          reject(err);
        } else {
          var passwordresult = await passwordCheck(password, resp[0].password);
          resolve(passwordresult);
        }
      }
    );
  });
};

//password check function
var passwordCheck = function (password, dbpass) {
  return new Promise(async (resolve, reject) => {
    bcrypt.compare(password, dbpass, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

//Login endpoint
app.post("/api/login", async (req, res, next) => {
  try {
    var credCheck = await credetialCheck(req.body.username, req.body.password);
    if (credCheck == true) {
      req.session.save(() => {
        sessionStore.set(req.session.id, req.session);
      });
      res.send({
        Message: "Login Successful",
        User: req.body.username,
        SessionID: req.session.id,
      });
    } else {
      const err = await createError(401, "Invalid Credentials");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Invalid Credentials");
    next(err);
  }
});

//Logout endpoint
app.post("/api/logout", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    var authorized = await isAuth(session);
    if (authorized) {
      {
        mysql.query(
          "DELETE FROM vertoex.sessions WHERE session_id='" + session + "'",
          (err, resp) => {
            if (err) {
              throw err;
            } else {
              res.send("Logout Successful");
            }
          }
        );
      }
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

//CRUD
//Display endpoint
app.get("/api/employees", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    var authorized = await isAuth(session);
    if (authorized) {
      var databasequery = `SELECT * FROM vertoex.employees `;
      if (req.query.search != undefined && req.query.filter == undefined) {
        databasequery += `WHERE firstname LIKE '%${req.query.search}%' OR lastname LIKE '%${req.query.search}%' OR employeenumber='${req.query.search}'`;
      } else if (
        req.query.search == undefined &&
        req.query.filter != undefined
      ) {
        databasequery += `WHERE dept='${req.query.filter}'`;
      } else if (
        req.query.search != undefined &&
        req.query.filter != undefined
      ) {
        databasequery += `WHERE (firstname LIKE '%${req.query.search}%' OR lastname LIKE '%${req.query.search}%' OR employeenumber='${req.query.search}') AND (dept LIKE '%${req.query.filter}%')`;
      }
      mysql.query(databasequery, (err, resp) => {
        if (err) {
          throw err;
        } else {
          res.send(resp);
        }
      });
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

//Create
//create employee endpoint
app.post("/api/employees", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    authorized = await isAuth(session);
    if (authorized) {
      {
        mysql.query(
          "INSERT INTO vertoex.employees(firstname,lastname,employeenumber,dept) VALUES(" +
            `'${req.body.first}','${req.body.last}','','${req.body.dept}')`,
          (err, resp) => {
            if (err) {
              throw err;
            } else {
              res.send(
                `Employee ${req.body.firstname} ${req.body.lastname} created`
              );
            }
          }
        );
      }
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

//create user endpoint(internal)
app.post("/api/users", async (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (err) {
      throw err;
    } else {
      mysql.query(
        `INSERT INTO vertoex.users(username,password) VALUES('${req.body["username"]}','${hash}')`,
        (err, resp) => {
          if (err) {
            throw err;
          } else {
            res.send({
              Message:
                "User " +
                req.body["username"] +
                " Successfully Created!",
            });
          }
        }
      );
    }
  });
});


//Delete endpoint
app.delete("/api/employees", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    var authorized = await isAuth(session);
    if (authorized) {
      {
        mysql.query(
          `DELETE FROM vertoex.employees WHERE id = '${req.body.id}'`,
          (err, resp) => {
            if (err) {
              throw err;
            } else {
              res.send(`Employee Deleted`);
            }
          }
        );
      }
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

//Update endpoint
app.patch("/api/employees", async (req, res, next) => {
  var session = req.headers.authorization.slice(7);
  try {
    var authorized = await isAuth(session);
    if (authorized) {
      {
        mysql.query(
          `UPDATE vertoex.employees SET firstname='${req.body.firstname}', lastname='${req.body.lastname}', dept='${req.body.dept}' WHERE id=${req.body.id}`,
          (err, resp) => {
            if (err) {
              throw err;
            } else {
              res.send(`Employee Updated`);
            }
          }
        );
      }
    } else {
      const err = await createError(401, "Unauthorized");
      next(err);
    }
  } catch (e) {
    const err = await createError(401, "Unauthorized");
    next(err);
  }
});

module.exports = app;