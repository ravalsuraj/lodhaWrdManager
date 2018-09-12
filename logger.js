const { createLogger, transports } = require('winston')
require("winston-daily-rotate-file");


const config = require("./config");
const options = config.logs;

const logger = createLogger({  

  transports: [
    //new transports.File(options.file),
    new transports.Console(options.console),
    new transports.DailyRotateFile(options.file)
  ]
});

module.exports = logger;