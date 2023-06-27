const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let dp = null;
const connectingDbAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "userData.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (error) {
    console.log(`Error ${error}`);
  }
};

connectingDbAndServer();

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;

  const userName = `select * from user where username='${username}'`;

  const checking = await db.get(userName);
  //console.log(checking);
  if (checking === undefined) {
    if (password.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const encryptedPassword = await bcrypt.hash(password, 10);
      const addingToDb = `
            INSERT INTO 
                user (username, name, password, gender, location) 
            VALUES 
                (
                '${username}', 
                '${name}',
                '${encryptedPassword}', 
                '${gender}',
                '${location}'
                )`;
      const runningIntoDb = await db.run(addingToDb);
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const sqlQuery = `select * from user where username="${username}";`;
  const result = await db.get(sqlQuery);
  if (result === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, result.password);
    if (isPasswordMatch === true) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const sqlQuery = `select * from user where username="${username}"`;
  const result = await db.get(sqlQuery);

  const isPasswordMatch = await bcrypt.compare(oldPassword, result.password);
  if (result === undefined) {
    res.send("No such user found");
  } else {
    if (isPasswordMatch === false) {
      res.status(400);
      res.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        res.status(400);
        res.send("Password is too short");
      } else {
        const updatedPass = await bcrypt.hash(newPassword, 10);

        const updateQuery = `update user 
        set 
        username="${username}",
        password="${updatedPass}"
        where username="${username}"

        `;
        const a = await db.run(updateQuery);
        console.log(a);
        res.status(200);
        res.send("Password updated");
      }
    }
  }
});

module.exports = app;
