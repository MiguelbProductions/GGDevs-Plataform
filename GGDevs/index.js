const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5002;

require('dotenv').config();

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index.html")
})

app.get("/*", (req, res) => {
  return res.render("404.html", {});
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
