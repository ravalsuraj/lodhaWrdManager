"use strict";
const express = require("express");
const router = express.Router();
const sql = require("mssql");

var apiController = require("../controllers/apiController");
router.use(function timeLog(req, res, next) {
  next();
});


//DB fetch and insert methods
router.get("/wrd/:wrd/ip" , apiController.get_ip);
router.post("/wrd/:wrd/ip/:ip" , apiController.post_ip);
router.get("/db/recording/wrd/:wrd/status", apiController.get_recordingStatus);
router.post("/db/recording/start" , apiController.post_startRecording);
router.post("/db/recording/stop", apiController.post_stopRecording);
router.post("/pistats", apiController.post_pistats);

//Routes to handle commands to wrd devices

//TODO: Change these methods to POST request, with the parameters sent in the body
router.get("/wrd/cmd/recording/start/ip/:ip/port/:port/url/:url", apiController.cmd_StartRecording);
router.get("/wrd/cmd/recording/stop/ip/:ip/port/:port/url/:url", apiController.cmd_StopRecording);
//END TODO

router.post("/wrd/cmd/shutdown/", apiController.cmd_Shutdown);

//router.get("/sf/test", apiController.sf_test);
router.post("/sf/recordedFileset", apiController.sf_postFileset);
/*
//Rest Calls to mock WRD response
router.get("/StartRecording/*", function(req, res) {
  res.send("Success");
});
router.get("/StopRecording/*", function(req, res) {
  res.send("Success" );
});
*/

module.exports = router;
