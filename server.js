import fetch from "node-fetch";
import express from "express";

const spotify_client_id = "";
const spotify_client_secret = "";
const spotify_redirect_uri = "http://localhost:3000/callback";

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

app.get("/", function (request, response) {
  response.render("index");
});

app.get("/authorize", (req, res) => {
  console.log("authorize");
});

app.get("/callback", async (req, res) => {
  console.log("callback");
});

app.get("/logout", function (request, response) {
  response.redirect("/");
});

app.get("/dashboard", async function (req, res) {
  console.log("callback");
});

let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});
