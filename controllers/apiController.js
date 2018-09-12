"use strict";

const sql = require("mssql");
const http = require("http");
const JSON = require("circular-json");
const request = require("request");

const config = require("./../config");
const logger = require("./../logger");
//AWS credentials
const dbconfig = config.db;

/****************************************
 * Get IP address: SELECT from DB
****************************************/
exports.get_ip = function (req, res) {
  let wrd = req.params.wrd;
  //const query_getIP = "select ip from tbl_wrdiphostname where hostname='" + wrd + "'";
  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      return pool
        .request()
        .input("hostname", sql.VarChar(50), wrd)
        .execute("sp_sel_tbl_wrdiphostname");
    })
    .then(result => {
      logger.info(JSON.stringify(result));

      if (result.recordset[0]) {
        let ip = result.recordset[0].ip;
        res.status(200).json({ ip: ip });
      } else {
        res.status(500).json({ message: "No Records Found" });
        logger.error(JSON.stringify(err));
        winston.log("debug", "Hello distributed log files!");
      }

      sql.close();
    })
    .catch(err => {
      res.status(500).json({ message: "Technical Error" });
      logger.error(JSON.stringify(err));
      sql.close();
    });
};

/****************************************
 * POST IP address: INSERT/UPDATE to DB
 ****************************************/
exports.post_ip = function (req, res) {
  let wrd = req.params.wrd;
  let ip = req.params.ip;

  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      logger.info("WRD = " + wrd);
      return pool
        .request()
        .input("hostname", sql.VarChar(50), wrd)
        .input("ip", sql.VarChar(50), ip)
        .execute("sp_upd_tbl_wrdiphostname");
    })
    .then(result => {
      logger.info(JSON.stringify(result));
      if (result) {
        res.json(result);
      } else {
        res.status(500).json({ message: "No Records Found" });
        logger.error(JSON.stringify(err));
      }

      sql.close();
    })
    .catch(err => {
      res.status(500).json({ message: "Technical Error" });
      logger.error(JSON.stringify(err));
      sql.close();
    });
};

/****************************************
 * GET Recording Start: SELECT STATUS FROM DB
 ****************************************/
exports.get_recordingStatus = function (req, res) {
  let wrd = req.params.wrd;
  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      return pool
        .request()
        .input("wrd", sql.VarChar(20), wrd)
        .execute("sp_sel_tbl_recordingdetails");
    })
    .then(result => {
      logger.info("DB_GET_REC_STATUS:" + JSON.stringify(result));
      res.json(result.recordset[0]);
      sql.close();
    })
    .catch(err => {
      logger.error("DB_GET_REC_STATUS:" + JSON.stringify(err));
      res.status(404).send(err);
      sql.close();
    });
};
/****************************************
 * POST Recording Start: INSERT into DB
 ****************************************/
exports.post_startRecording = function (req, res) {
  logger.info("DB_INSERT_START_REC:" + req.body.wavFileName);
  let channels = req.body.channels;
  let rate = req.body.rate;
  let frames_per_buffer = req.body.frames_per_buffer;
  let customername = req.body.customername;
  let customersWRDnumber = req.body.customersWRDnumber;
  let customerNumber = req.body.customerNumber;
  let Smname = req.body.Smname;
  let Smid = req.body.Smid;
  let SMWRDnumber = req.body.SMWRDnumber;
  let status = req.body.status;
  let commonFileName = req.body.commonFileName;
  let recordingWrd = req.body.recordingWrd;
  let ip = req.body.ip;

  //let myDate = moment(1403454068850).tz("Asia/Calcutta").format();
  //  let myDate = moment(data.myTime.format('YYYY/MM/DD HH:mm:ss')).format("YYYY-MM-DD HH:mm:ss");
  //logger.info(myDate);
  let wavFileName = req.body.wavFileName;
  if (req.body) {
    new sql.ConnectionPool(dbconfig)
      .connect()
      .then(pool => {
        return pool
          .request()
          .input("channels", sql.Int, channels)
          .input("rate", sql.Int, rate)
          .input("frames_per_buffer", sql.Int, frames_per_buffer)
          .input("wavFileName", sql.VarChar(50), wavFileName)
          .input("commonFileName", sql.VarChar(50), commonFileName)
          .input("IP", sql.VarChar(15), ip)
          .input("recordingWrd", sql.VarChar(20), recordingWrd)
          .input("customername", sql.VarChar(50), customername)
          .input("customerNumber", sql.VarChar(50), customerNumber)
          .input("customersWRDnumber", sql.VarChar(20), customersWRDnumber)
          .input("Smname", sql.VarChar(50), Smname)
          .input("Smid", sql.VarChar(10), Smid)
          .input("SMWRDnumber", sql.VarChar(20), SMWRDnumber)
          .input("status", sql.VarChar(7), status)
          .input("recordingstartedon", sql.DateTimeOffset, new Date())

          .execute("sp_ins_tbl_recordingdetails");
      })
      .then(result => {
        logger.info(JSON.stringify(result));
        if (result) {
          let status = result.returnValue >= 0 ? "Success" : "Failure";
          res.json({ Status: status });
          logger.info(
            "DB_INSERT_START_REC:" + wavFileName + " Status:" + status
          );
        } else {
          let status = "Failure";
          res.json({ Status: status });
          logger.info(
            "DB_INSERT_START_REC:" + wavFileName + " Status:" + status
          );
        }

        sql.close();
      })
      .catch(err => {
        logger.error("DB_INSERT_START_REC:Promise Rejected:" + err);
      });
    sql.on("error", err => {
      logger.error("DB_INSERT_START_REC:Error:" + err);
    });
  }
};

/****************************************
 * POST Recording STOP: UPDATE Recording Details
 ****************************************/
exports.post_stopRecording = function (req, res) {
  logger.info("DB_UPDATE_STOP_REC:Status:" + req.body.wavFileName);
  let wavFileName = req.body.wavFileName;
  let status = req.body.status;
  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      return pool
        .request()
        .input("wavFileName", sql.VarChar(50), wavFileName)
        .input("recordingstopedon", sql.DateTime, new Date())
        .input("status", sql.VarChar(7), status)
        .execute("sp_upd_tbl_recordingdetails");
    })
    .then(result => {
      logger.info(JSON.stringify(result));
      if (result) {
        let status = result.returnValue >= 0 ? "Success" : "Failure";
        res.json({ Status: status });
        logger.info("DB_INSERT_STOP_REC:" + wavFileName + " Status:" + status);
      } else {
        let status = "Failure";
        res.json({ Status: status });
        logger.info("DB_INSERT_STOP_REC:" + wavFileName + " Status:" + status);
      }

      sql.close();
    })
    .catch(err => {
      logger.error(
        "DB_INSERT_STOP_REC:Promise Rejected:" + JSON.stringify(err)
      );
    });
};

/****************************************
 * Update Pi Stats in DB
 ****************************************/
exports.post_pistats = function (req, res) {
  let hostname = req.body.hostname;
  let cputemp = req.body.cputemp;
  let cpuused = req.body.cpuused;
  let ramused = req.body.ramused;
  let diskused = req.body.diskused;

  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      return pool
        .request()
        .input("hostname", sql.VarChar(50), hostname)
        .input("cputemp", sql.VarChar(20), cputemp)
        .input("cpuused", sql.VarChar(20), cpuused)
        .input("ramused", sql.VarChar(20), ramused)
        .input("diskused", sql.VarChar(20), diskused)
        .execute("sp_ins_tbl_pistats");
    })
    .then(result => {
      if (result) {
        let status = result.returnValue >= 0 ? "Success" : "Failure";
        res.json({ Status: status });
        logger.info("DB_INSERT_PISTATS:" + hostname + " Status:" + status);
      } else {
        let status = "Failure";
        res.json({ Status: status });
        logger.info("DB_INSERT_PISTATS:" + hostname + " Status:" + status);
      }

      sql.close();
    });
};

/****************************************
 * Send a START command to start a WRD
 ****************************************/
exports.cmd_StartRecording = function (req, res) {
  let ip = req.params.ip;
  let port = req.params.port;
  let url = req.params.url;
  let options = {
    host: ip,
    path: "/startRecording/" + url,
    method: "GET",
    port: port,
    timeout: config.wrd.timeout
  };
  let request = http.get(options, function (response) {
    logger.info(
      "WRD_CMD_REC_START:STATUSCODE: " + JSON.stringify(response.statusCode)
    );

    // Buffer the body entirely for processing as a whole.
    let bodyChunks = [];
    response
      .on("data", function (chunk) {
        // You can process streamed parts here...
        bodyChunks.push(chunk);
      })
      .on("end", function () {
        let body = Buffer.concat(bodyChunks);
        logger.info("WRD_CMD_REC_START:IP:" + ip + " Status:" + body);
        // ...and/or process the entire body here.
        res.status(200).send(body + "");
      });
  });
  request.on("socket", function (socket) {
    socket.setTimeout(1000);
    socket.on("timeout", function () {
      logger.info("Request timed out");
      logger.info(
        "WRD_CMD_REC_START:IP:" + ip + " Status:" + "Request Timed Out"
      );
      req.abort();
      res.status(200).send("FAILURE");
    });
  });

  request.on("error", function (err) {
    if (err.code === "ECONNRESET") {
      logger.info("WRD_CMD_REC_START:IP:" + ip + " Status:" + "Request Failed");
      res.status(200).send("FAILURE");
      //specific error treatment
    }
    //other error treatment
  });
};
/****************************************
 * Send a STOP command to stop a WRD
 ****************************************/
exports.cmd_StopRecording = function (req, res) {
  let ip = req.params.ip;
  let port = req.params.port;
  let url = req.params.url;
  let options = {
    host: ip,
    path: "/stopRecording/" + url,
    method: "GET",
    port: port,
    timeout: config.wrd.timeout
  };
  let request = http.get(options, function (response) {
    logger.info("WRD_CMD_REC_STOP:STATUSCODE: " + response.statusCode);

    // Buffer the body entirely for processing as a whole.
    let bodyChunks = [];
    response
      .on("data", function (chunk) {
        // You can process streamed parts here...
        bodyChunks.push(chunk);
      })
      .on("end", function () {
        let body = Buffer.concat(bodyChunks);
        logger.info("WRD_CMD_REC_STOP: " + JSON.stringify(body));
        // ...and/or process the entire body here.
        res.status(200).send(body + "");
      })
      .on("socket", function (e) {
        logger.info("WRD_CMD_REC_STOP:SOCKET " + e.message);
        //res.status(200).send("SOCKETTTT");
      });
  });

  request.on("error", function (e) {
    logger.error("WRD_CMD_REC_STOP:ERROR: " + e.message);
    res.status(200).send("FAILURE");
  });
};

/*****************************************
 * COMMAND TO SHUT A WRD DOWN
 * *************************************/

exports.cmd_Shutdown = function (req, res) {
  let wrd = req.body.wrd;

  /*******Get IP before sending shutdown command***********/
  new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
      return pool
        .request()
        .input("hostname", sql.VarChar(50), wrd)
        .execute("sp_sel_tbl_wrdiphostname");
    })
    .then(result => {
      let ip = result.recordset[0].ip;

      /**************  START SHUTDOWN Command ********************/
      let wrdport = config.wrd.port;
      let options = {
        host: ip,
        path: "/shutdown/",
        method: "GET",
        port: wrdport,
        timeout: config.wrd.timeout
      };

      //let result = "";
      let request = http.get(options, function (response) {
        logger.info("CMD_SHUTDOWN_STATUS: " + response.statusCode);

        // Buffer the body entirely for processing as a whole.
        let bodyChunks = [];
        response
          .on("data", function (chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
          })
          .on("end", function () {
            let body = Buffer.concat(bodyChunks);
            logger.info("WRD_CMD_REC_STOP: " + JSON.stringify(body));
            // ...and/or process the entire body here.
            res.status(200).send(body + "");
          })
          .on("socket", function (e) {
            logger.info("WRD_CMD_REC_STOP:SOCKET " + e.message);
            //res.status(200).send("SOCKETTTT");
          });
      });
      request.on("error", function (e) {
        logger.info("ERROR: " + e);
        res.status(200).send("FAILURE");
      });
      /*********END SHUT DOWN COMMAND************************ */
      sql.close();
    })
    .catch(err => {
      res.status(500).json({ message: "Technical Error" });
      logger.error("CMD_SHUTDOWN_RESULT" + err);
      sql.close();
    });
};

exports.sf_test = function (req, res) {
  console.log("sf test entered");
  let token, instanceUrl;  // to be used from the response

  let request = require("request");
  var options = {
    method: 'POST',
    url: 'https://test.salesforce.com/services/oauth2/token',
    qs: config.sf.queryString,
    headers:
      { 'Cache-Control': 'no-cache' }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    res.send(body);

    token = body.access_token;
    instanceUrl = body.instance_url

  });
};


exports.sf_postFileset = function (req, res) {

  let token, instanceUrl;  // to be used from the response
  let eventId = req.body.eventId;
  let custWavFileName = req.body.custWavFileName;
  let smWavFileName = req.body.smWavFileName;
  let commonFileName = req.body.commonFileName;
  var options = {
    method: 'POST',
    url: 'https://test.salesforce.com/services/oauth2/token',
    qs: config.sf.queryString,
    headers:
      { 
        'Cache-Control': 'no-cache' 
      },
      timeout: 10000
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log("SF_LOGIN: BODY:" + JSON.stringify(body));
    //res.send(body);
    token = JSON.parse(body).access_token;
    instanceUrl = body.instance_url;

    /*********************************
     *  Sending Files
     ********************************/
    var options = {
      method: 'PATCH',
      timeout: 10000,
      json: true,
      body: {
        "FAME_Remarks_for_Reject_Hold__c": commonFileName,
        "Query_Sub_Type_System_Related__c": smWavFileName,
        "Sub_query_Type_Customer_Related__c": custWavFileName,
        "LG_DM__c": true
      },
      url: 'https://lodha--PreProd.my.salesforce.com/services/data/v20.0/sobjects/Event/' + eventId,
      headers:
      {
        'Cache-Control': 'no-cache',
        'Authorization': 'Bearer ' + token
      }
    };
    console.log("SF_UPLOAD: TOKEN IS:"+token);
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      console.log("SF_UPLOAD: STATUS CODE: "+response.statusCode);
      if(response.statusCode == "204"){
        console.log("sending Success");
        res.status(200).json("Success");
      }
      else{
        console.log("sending Failure");
        res.status(404).json("Failure");
      }
      
    });
    /***********************************/
  });
};

/*

timestamp	wavFileName	recordingstartedon	recordingstopedon	channels	rate	frames_per_buffer	customername	customernumber	customersWRDnumber	Smname	Smid	SMWRDnumber	status
2018-08-20 17:54:10.067	wavfilename	2018-08-20 17:51:48.217	2018-08-20 17:51:48.217	1	1	1	abcd	qwert	qwer	qwer	qwer	qwer	qwer

*/