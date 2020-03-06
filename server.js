const express = require("express");
const app = express();

const apiRouter = require("./routers/apiRouter");
const webRouter = require("./routers/webRouter");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const moment = require("moment-timezone");

const logger = require("./logger");
const config = require("./config");
const PORT = config.port || 4000;

app.set("view engine", "pug");
app.use(express.static("public"));

morgan("tiny");

morgan.token("date", (req, res, tz) => {
  return moment()
    .tz(tz)
    .format();
});
morgan.format("myformat", config.logs.morgan.format);
app.use(morgan("myformat", { stream: { write: message => logger.info(message.trim()) } }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
console.log("adding a log");
console.log("added second logs");
app.use("/", webRouter);
app.use("/api", apiRouter);

app.listen(PORT, () => {
  logger.log("info", "Lodha Web App listening on port " + PORT);
});
// npm config set proxy 165.225.104.34:80
// npm config set https - proxy 165.225.104.34:80
