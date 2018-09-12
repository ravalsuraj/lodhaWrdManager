
//Important: Set the env to either development or production to use the appropriate config
/****************************************/
const env = "production"; // 'development' or 'production'
/*******************************************/

var appRoot = require("app-root-path");
const { format } = require("winston");
const { combine, timestamp, printf } = format;

//Important configurations
const APP_PORT = 4000;
const WRD_TIMEOUT = 5000;
const DB_TIMEOUT = 5000; //Timeout for db response
const DB_IDLE_POOL_TIMEOUT = 30000; //CLosing a connection pool when no requests are made
const LOG_FOLDER = `${appRoot}/logs/node_trace.log`;

//All Configurations
const development = {
  app: {
    port: APP_PORT
  },
  aws: {
    s3: {
      url: "https://s3.amazonaws.com/audiocapture/"
    }
  },
  ws: {
    timeout: DB_TIMEOUT //milliseconds
  },
  db: {
    user: "sa",
    password: "1234",
    server: "10.211.55.7",
    database: "wrd1",
    connectionTimeout: DB_TIMEOUT,
    pool: { max: 10, min: 0, idleTimeoutMillis: DB_IDLE_POOL_TIMEOUT }
  },

  logs: {
    file: {
      level: "info",
      filename: LOG_FOLDER,
      datePattern: "YYYY-MM-DD",
      handleExceptions: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: combine(
        //Format of the timestamp
        timestamp(
          {
            format: "YYYY-MM-DD HH:MM:ss:SSS"
          }
        ),
        //Format of the Log contents
        printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      ),

    },
    console: {
      level: "debug",
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true,
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:MM:ss:SSS" }),
        printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      )
    },
    morgan: {
      format: ":method :url :status :res[content-length] - :response-time ms"
    }
  },
  wrd: {
    port: 4000,
    timeout: WRD_TIMEOUT,
    channels: "1",
    rate: "48000",
    frames_per_buffer: "2400"
  },
  sf: {
    queryString: {
      grant_type: 'password',
      client_id: '3MVG92H4TjwUcLlLcF8ynphIDHP1Jv7VtjE9oxUD8fIS4WRyXXRRAK5BHSl1UZPL42x6byUeM0dvFAUQyp87x',
      client_secret: '480151581581597201',
      username: 'mansuri.oovais@saasfocus.com',
      password: 'Lodha1237ym3aGT2HfXtgp4xfM552pgmt'
    }
  }
};

const production = {
  app: {
    port: APP_PORT
  },
  aws: {
    s3: {
      url: "https://s3.amazonaws.com/audiocapture/"
    }
  },
  ws: {
    timeout: DB_TIMEOUT, //milliseconds
  },
  db: {
    user: "admin",
    password: "admin1234",
    server: "lodhawrd.cno6kx2hw0fc.ap-south-1.rds.amazonaws.com",
    database: "wrd1",
    connectionTimeout: DB_TIMEOUT,
    pool: { max: 10, min: 0, idleTimeoutMillis: DB_IDLE_POOL_TIMEOUT }
  },
  logs: {
    file: {
      level: "info",
      filename: LOG_FOLDER,
      datePattern: "YYYY-MM-DD",
      handleExceptions: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: combine(
        //Format of the timestamp
        timestamp({
          format: "YYYY-MM-DD HH:MM:ss:SSS"
        }),
        //Format of the Log contents
        printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      )
    },
    console: {
      level: "debug",
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true,
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:MM:ss:SSS" }),
        printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      )
    },
    morgan: {
      format: ":method :url :status :res[content-length] - :response-time ms"
    }
  },
  wrd: {
    port: 8080,
    timeout: WRD_TIMEOUT,
    channels: "1",
    rate: "48000",
    frames_per_buffer: "2400"
  },
  sf: {
    queryString: {
      grant_type: "password",
      client_id: "3MVG92H4TjwUcLlLcF8ynphIDHP1Jv7VtjE9oxUD8fIS4WRyXXRRAK5BHSl1UZPL42x6byUeM0dvFAUQyp87x",
      client_secret: "480151581581597201",
      username: "mansuri.oovais@saasfocus.com",
      password: "Lodha1237ym3aGT2HfXtgp4xfM552pgmt"
    }
  }
};

const config = {
  development,
  production
};

module.exports = config[env];
