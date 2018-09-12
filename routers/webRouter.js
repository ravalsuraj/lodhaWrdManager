"use strict";

var express = require("express");
var router = express.Router();

var webController = require("../controllers/webController");

router.use(function timeLog(req, res, next) {
  next();
});

//Serve the webpage
router.get("/", webController.get_home);
router.get("/startRecording/*", webController.mock_serve_StartRecording);
router.get("/stopRecording/*", webController.mock_serve_StopRecording);
router.get("/shutdown/*", webController.mock_serve_shutdown);

module.exports = router;
