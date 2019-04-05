const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const moment = require("moment");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log(process.env.VERIFY_TOKEN, process.env.PAGE_ACCESS_TOKEN);
const weekEnd = ["weekend", "we", "week end", "week-end"];

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    "Express server listening on port %d in %s mode",
    server.address().port,
    app.settings.env
  );
});

function getNextFriday() {
  var dayINeed = 5;

  var deadline;

  if (moment().isoWeekday() === 6 || moment().isoWeekday() === 7)
    return `C'est le week-end !`;
  else if (moment().isoWeekday() <= dayINeed) {
    deadline = moment().isoWeekday(dayINeed);
  } else {
    deadline = moment()
      .add(1, "weeks")
      .isoWeekday(dayINeed);
  }
  deadline.startOf("day").set({ h: 18 });
  const now = moment();
  let days = deadline.diff(now, "days");
  let hours = deadline.subtract(days, "days").diff(now, "hours");
  let minutes = deadline.subtract(hours, "hours").diff(now, "minutes");
  if (!days) days = 0;
  if (!hours) hours = 0;
  if (!minutes) minutes = 0;

  return `C'est dans ${days ? `${days} jours, ` : ""}${
    hours ? `${hours} heures et` : ""
  } ${`${minutes} minutes.`}`;
}

/* For Facebook Validation */
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] &&
    req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
  ) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post("/webhook", (req, res) => {
  console.log(req.body);
  if (req.body.object === "page") {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          if (
            new RegExp(weekEnd.join("|")).test(event.message.text.toLowerCase())
          ) {
            sendMessage(event.sender.id, getNextFriday());
          }
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(senderId, message) {
  request(
    {
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: {
        recipient: { id: senderId },
        message: { text: message }
      }
    },
    function(error, response) {
      if (error) {
        console.log("Error sending message: ", error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    }
  );
}
