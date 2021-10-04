//Test Suite - Verto Health Coding Challenge
//Trevor Harvey

const app = require("./app");
const supertest = require("supertest");
const { test, expect } = require("@jest/globals");

var token = "";

//before testing, get a valid token to use
const login = async function () {
  return new Promise(async (resolve, reject) => {
    let res = await supertest(app).post("/api/login").send({
      username: "testaccount",
      password: "tester",
    });
    resolve(res.body.SessionID);
  });
};

beforeAll(async () => {
  let res = await login();
  token = res;
});

//Ping Test
test("Should receive status 200 on ping request", async () => {
  await supertest(app)
    .get("/api/ping")
    .set("Authorization", "Bearer " + token)
    .expect(200);
});

//Login Test
test("Should login Successfully", async () => {
  await supertest(app)
    .post("/api/login")
    .send({
      username: "testaccount",
      password: "tester",
    })
    .expect(200);
});

//Login Test
test("Should not login; invalid user + password", async () => {
  await supertest(app)
    .post("/api/login")
    .send({
      username: "wrong username",
      password: "wrong password",
    })
    .expect(401);
});

//Login Test
test("Should not login; invalid password", async () => {
  await supertest(app)
    .post("/api/login")
    .send({
      username: "testaccount",
      password: "wrong password",
    })
    .expect(401);
});

//Get all employees
test("Should receive a not empty set of employees", async () => {
  let res = await supertest(app)
    .get("/api/employees")
    .set("Authorization", "Bearer " + token);
  expect(res.body.length > 0 && res.body[0].id != undefined);
});

//Search employees
test("Should receive a set of employees filtered by first/last name by some letter string #1", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=ro")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(
      res.body[i].firstname.includes("ro") ||
        res.body[i].firstname.includes("ro")
    );
  }
});

//Search employees
test("Should receive a set of employees filtered by first/last name by some letter string #2", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=j")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(
      res.body[i].firstname.includes("j") || res.body[i].firstname.includes("j")
    );
  }
});

//Search employees by id
test("Should receive a set of employees filtered by id", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=1")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(res.body[i].id == 1);
  }
});

//Search employees invalid
test("Should receive an empty set of employees for searching invalid string ", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=!!!!!!!!")
    .set("Authorization", "Bearer " + token);
  expect(res.body.length == 0);
});

//Filter employees
test("Should receive a set of employees filtered by dept", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=&dept=Sales")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(res.body[i].dept == "Sales");
  }
});

//Filter employees
test("Should receive a set of employees filtered by dept #2", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=&dept=Engineering")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(res.body[i].dept == "Engineering");
  }
});

//Search employees invalid
test("Should receive an empty set of employees for filtering invalid dept", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=&dept=invaliddept")
    .set("Authorization", "Bearer " + token);
  expect(res.body.length == 0);
});

//Filter employees
test("Should receive a set of employees filtered by dept #2", async () => {
  let res = await supertest(app)
    .get("/api/employees?search=m&dept=Engineering")
    .set("Authorization", "Bearer " + token);
  for (let i = 0; i < res.body.length; i++) {
    expect(
      res.body[i].dept == "Engineering" &&
        (res.body[i].firstname.includes("m") ||
          res.body[i].firstname.includes("m"))
    );
  }
});

//Post new employee

describe("Post test", () => {
  test("Should post new employee to database", async () => {
    await supertest(app)
      .post("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({
        first: "dummytestuser123456",
        last: "dummytestuser123456",
        dept: "Sales",
      });

    let res = await supertest(app)
      .get("/api/employees&search=dummytestuser123456")
      .set("Authorization", "Bearer " + token);
    expect((res.body.length = 1));
  });

  //delete the user after testing
  afterEach(async () => {
    let res = await supertest(app)
      .get("/api/employees?search=dummytestuser123456")
      .set("Authorization", "Bearer " + token);
    let id = res.body[0].id;
    await supertest(app)
      .delete("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({ id: id });
  });
});

describe("Update test", () => {
  beforeEach(async () => {
    await supertest(app)
      .post("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({
        first: "dummytestuser12345678",
        last: "dummytestuser12345678",
        dept: "Sales",
      });
    let res = await supertest(app)
      .get("/api/employees?search=dummytestuser12345678")
      .set("Authorization", "Bearer " + token);
    id = res.body[0].id;
  });

  //Update employee
  test("Should update employee name", async () => {
    await supertest(app)
      .patch("/api/employees")
      .send({
        id: id,
        firstname: "dummytestuser12345678updated",
        lastname: "dummytestuser12345678updated",
        dept: "Sales",
      })
      .set("Authorization", "Bearer " + token);

    let updated = await supertest(app)
      .get("/api/employees?search=dummytestuser12345678updated")
      .set("Authorization", "Bearer " + token);
    expect(updated.body.length == 1);
  });

  test("Should update employee name and dept", async () => {
    await supertest(app)
      .patch("/api/employees")
      .send({
        id: id,
        firstname: "dummytestuser12345678updated",
        lastname: "dummytestuser12345678updated",
        dept: "Engineering",
      })
      .set("Authorization", "Bearer " + token);

    let updated = await supertest(app)
      .get(
        "/api/employees?search=dummytestuser12345678updated&dept=Engineering"
      )
      .set("Authorization", "Bearer " + token);
    expect(updated.body.length == 1);
  });
  //delete the user after testing
  afterEach(async () => {
    let res = await supertest(app)
      .get("/api/employees?search=dummytestuser12345678updated")
      .set("Authorization", "Bearer " + token);
    let id = res.body[0].id;
    await supertest(app)
      .delete("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({ id: id });
  });
});

describe("Delete test", () => {
  //create an employee to delete
  beforeEach(async () => {
    await supertest(app)
      .post("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({
        first: "dummytestuser12345678",
        last: "dummytestuser12345678",
        dept: "Sales",
      });
  });

  //Delete employee
  test("Should Delete employee", async () => {
    let res = await supertest(app)
      .get("/api/employees?search=dummytestuser12345678")
      .set("Authorization", "Bearer " + token);
    let id = res.body[0].id;
    await supertest(app)
      .delete("/api/employees")
      .set("Authorization", "Bearer " + token)
      .send({ id: id });

    res = await supertest(app)
      .get("/api/employees?search=dummytestuser12345678")
      .set("Authorization", "Bearer " + token);
    expect(res.body.length == 0);
  });
});
