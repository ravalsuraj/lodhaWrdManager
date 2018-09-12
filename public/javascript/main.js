/*******************************************************************
 * Initializing Variables
 *******************************************************************/
//Constants
const CHANNELS = config.wrd.channels;
const RATE = config.wrd.rate;
const FRAMES_PER_BUFFER = config.wrd.frames_per_buffer;
const WRD_PORT = config.wrd.port;
const WRD_TIMEOUT = config.wrd.timeout;
const AWS_S3_URL = config.aws.s3.url;
//Global Variables
let customerStatus = "";
let smStatus = "";
let wavFileName = "";
let custWavFileName = "";
let smWavFileName = "";
let commonWavFileName = "";
let UniqueSessionId = "";
let wrdEndpoint = "";
let custIp = "";
let smIp = "";

//Element selectors
let customername = $("input#cust-name").val();
let customersWRDnumber = $("input#cust-wrd").val();
let customerNumber = $("input#cust-num").val();
let Smname = $("input#sm-name").val();
let Smid = $("input#sm-id").val();
let SMWRDnumber = $("input#sm-wrd").val();
let eventId = urlparams.eventId || "00U3E000002OxGoUAK";

$.ajaxSetup({ timeout: WRD_TIMEOUT }); //in milliseconds

$(document).ready(function() {
  if (isTouchDevice() === false) {
    $('[data-toggle="tooltip"]').tooltip();
  }

  if (customersWRDnumber.length < 3 || SMWRDnumber.length < 3) {
    showAlert(
      "warning",
      "Please check the customer or SM WRD number in the URL. The URL should be formatted as:" +
        "\nhttp://{url}:4000?custWrd=wrd001&smWrd=wrd002"
    );
  } else {
    getWrdStatus(customersWRDnumber, "cust");
    getWrdStatus(SMWRDnumber, "sm");
  }
  //Monitor Incoming URL with parameters
  console.log(
    "WEBPAGE_LOADED: \ncustName: " +
      customername +
      ", custWrd: " +
      customersWRDnumber +
      ", customer Number: " +
      customerNumber +
      ", \nSM Name: " +
      Smname +
      ", Sm ID: " +
      Smid +
      "SM WRD: " +
      SMWRDnumber
  );

  //Monitor Recording Start/Stop button
  $("#wrdControlSwitch").change(function() {
    //Clean any open alerts and loading spinners upon retry
    hideAlert();
    showLoader();

    //Disable the ON/OFF Button to prevent duplicate presses, and add a loading spinner to indicate processing.
    $("#wrdControlSwitch").prop("disabled", true);
    $("#loader_container").html("<div class='loader'></div>");
    $("#cust-recordStatus").val("Please wait, processing.....");
    $("#cust-recordStatus").css("color", "grey");
    $("#sm-recordStatus").val("Please wait, processing.....");
    $("#sm-recordStatus").css("color", "grey");

    let isChecked = $("#wrdControlSwitch").is(":checked");
    //if Customer or SM WRD numbers are not present, display an error and revert the checkbox
    if (customersWRDnumber.length < 3 || SMWRDnumber.length < 3) {
      showAlert(
        "warning",
        "Please check the customer or SM WRD number in the URL. The URL should be formatted as:\nhttp://{url}:4000?custWrd=wrd001&smWrd=wrd002"
      );

      //Update UI with error message
      //resetLoadingUI();
      $("#cust-recordStatus").val($("#wrdControlSwitch").is(":checked") ? "Started" : "Stopped");
      $("#cust-recordStatus").css("color", $("#wrdControlSwitch").is(":checked") ? "green" : "grey");
      $("#sm-recordStatus").val($("#wrdControlSwitch").is(":checked") ? "Started" : "Stopped");
      $("#sm-recordStatus").css("color", $("#wrdControlSwitch").is(":checked") ? "green" : "grey");
    } else {
      if (isChecked) {
        //if user requests to START the WRDs
        //Format a unique ID from current time
        const ft = getFormattedTime();
        UniqueSessionId = ft;
        //Run Business Logic to control Customer and SM WRD and post to logs.
        onWrdToggle(customersWRDnumber, "cust", "Start", UniqueSessionId);
        onWrdToggle(SMWRDnumber, "sm", "Start", UniqueSessionId);
      } else {
        //if user requests to STOP the WRDs
        onWrdToggle(customersWRDnumber, "cust", "Stop", UniqueSessionId);
        onWrdToggle(SMWRDnumber, "sm", "Stop", UniqueSessionId);
      }
    }
  });

  //Function called whenever any WRD is requested to be toggled.
  // This handles all the business logic and db logging involved for starting and stopping recording of WRDs
  function onWrdToggle(wrd, custSm, cmd, UniqueSessionId) {
    wrdEndpoint = cmd == "Start" ? "StartRecording" : "StopRecording";

    /*******************************************************************
     * Asynchronus call to Fetch IP address of a WRD from their hostname
     *******************************************************************/
    let url_fetchIP = "/api/wrd/" + wrd + "/ip";

    const promiseGetIP = new Promise((resolve, reject) => {
      let request = $.get(url_fetchIP);

      request.done(function(msg) {
        resolve(msg);
        console.log("DB_IP:(" + custSm + ") Response received:" + JSON.stringify(msg));
      });

      request.fail(function(msg, err) {
        showAlert("danger", "We could not connect to one of the WRD devices. Please refresh the page and try again.\n");
        console.log("DB_IP:(" + custSm + ") Request failed:" + JSON.stringify(msg));
        cmd == "Start" ? $("#wrdControlSwitch").prop("checked", false) : $("#wrdControlSwitch").prop("checked", true);
        resetLoadingUI();
        $("#" + custSm + "-recordStatus").val("Failed");
        $("#" + custSm + "-recordStatus").css("color", "red");
        reject(err);
      });
    });

    //Get IP promise resolved successfully
    promiseGetIP
      .then(data => {
        console.log("DB_IP:Promise Resolved:IP ADDRESS:(" + custSm + ")" + JSON.stringify(data));
        ip = data.ip.replace(/\"/g, "");
        if (custSm == "cust") {
          custIp = ip;
        } else {
          smIp = ip;
        }

        const promiseSendWrdCommand = new Promise((resolve, reject) => {
          if (cmd == "Start") {
            if (custSm == "cust") {
              //Set Filename for Customer's WRD
              custWavFileName = customersWRDnumber + "_" + SMWRDnumber + "_" + UniqueSessionId;
              wavFileName = custWavFileName;
            } else if (custSm == "sm") {
              //Set Filename for SM's WRD
              smWavFileName = SMWRDnumber + "_" + customersWRDnumber + "_" + UniqueSessionId;
              wavFileName = smWavFileName;
            }
            //Combined filename for merged files. Note, the file does not get uploaded from this application. It is uploaded directly from the WRD
            commonWavFileName = "comb_" + custWavFileName;
              url_WrdControlWSpaces = "/api/wrd/cmd/recording/start/ip/" + ip + "/port/" + WRD_PORT + "/url/" + wavFileName + ".wav," + CHANNELS + "," + RATE + "," + FRAMES_PER_BUFFER + "," + customername + "," + $("input#cust-num").val() + "," + SMWRDnumber + "," + $("input#sm-name").val() + "," + $("input#sm-id").val() + "," + SMWRDnumber;
            //Remove all blank spaces
            url_WrdControl = url_WrdControlWSpaces.replace(/ /g, "+");

            console.log("WRD_CMD_REC_START:(" + custSm + ")" + "URL Formatted:" + url_WrdControl);
          } else if (cmd == "Stop") {
              url_WrdControlWSpaces = "/api/wrd/cmd/recording/stop/ip/" + ip + "/port/" + WRD_PORT + "/url/" + customername + "," + customerNumber + "," + customersWRDnumber + "," + Smname + "," + Smid + "," + SMWRDnumber;
            //Remove all blank spaces
            url_WrdControl = url_WrdControlWSpaces.replace(/ /g, "+");
            console.log("WRD_CMD_REC_STOP:(" + custSm + ")" + "URL Formatted:" + url_WrdControl);
          }

          /********************************************************
           * Asynchronus call to Fetch IP address of a WRD from their hostname
           *********************************************************/
          let request = $.get(url_WrdControl);

          request.done(function(msg) {
            console.log("WRD_CMD_REC_START_STOP: AJAX Response Received:(" + custSm + ")" + JSON.stringify(msg));
            resolve(msg);
          });
          request.fail(function(msg, err) {
            showAlert(
              "danger",
              "We could not connect to one of the WRD devices. Please refresh the page and try again."
            );

            cmd == "Start"
              ? $("#wrdControlSwitch").prop("checked", false)
              : $("#wrdControlSwitch").prop("checked", true);
            resetLoadingUI();
            $("#" + custSm + "-recordStatus").val("Failed");
            $("#" + custSm + "-recordStatus").css("color", "red");
            reject(err);
          });
        });
        //WRD Command promise resolved successfully
        promiseSendWrdCommand
          .then(data => {
            let recordingStatus = "not started";

            console.log("WRD_CMD_REC_START_STOP: Promise Resolved:(" + custSm + ")" + JSON.stringify(data));
            if (data == "Success") {
              recordingStatus = cmd == "Start" ? "Started" : "Stopped";
              resetLoadingUI();
              $("#" + custSm + "-recordStatus").val(recordingStatus);
              $("#" + custSm + "-recordStatus").css("color", cmd == "Start" ? "green" : "grey");
            } else {
              //if wrd command is not successful

              recordingStatus = "Failed";
              showAlert(
                "danger",
                "Sorry, one of the WRD devices could not process your request. Please refresh the page and try again"
              );
              resetLoadingUI();
              $("#" + custSm + "-recordStatus").val("Failed");
              $("#" + custSm + "-recordStatus").css("color", "red");
            }
            //POST Recording Details
            if (cmd == "Start") {
              insertStartRecordingDetails(recordingStatus, custSm);
            } else if (cmd == "Stop") {
              updateStopRecordingDetails(recordingStatus, custSm);
              if (cmd == "Stop" && custSm == "sm") {
                uploadFilenamesToSalesforce();
              }
            }
          })
          .catch(
            //WRD Command Promise rejected
            error => {
              showAlert(
                "danger",
                "Sorry, one of the WRD devices could not process your request. Please refresh the page and try again"
              );
              resetLoadingUI();
              $("#" + custSm + "-recordStatus").val("Failed");
              $("#" + custSm + "-recordStatus").css("color", "red");
              console.log("WRD_CMD_REC_START_STOP:Promise Rejected:(" + custSm + ")" + error);
            }
          );
      })
      .catch(
        // Get IP Promise rejected
        error => {
          showAlert(
            "danger",
            "Sorry, we could not fetch the IP address for one of the WRD devices. Please refresh the page and try again"
          );
          resetLoadingUI();
          $("#" + custSm + "-recordStatus").val("Failed");
          $("#" + custSm + "-recordStatus").css("color", "red");
          console.log("DB_IP: Promise Rejected: " + error);
        }
      );
  }
  /***********************************************************************
   * Method to call API to post Recording details when starting a WRD
   ***********************************************************************/
  function insertStartRecordingDetails(status, custSm) {
    console.log("DB_REC_START:(" + custSm + ") :Status:" + status);
    let myStatus = status;
    let recordingstartedon = new Date();

    let request = $.ajax({
      url: "/api/db/recording/start",
      method: "POST",
      data: {
        channels: CHANNELS,
        rate: RATE,
        frames_per_buffer: FRAMES_PER_BUFFER,
        customername: customername,
        customersWRDnumber: customersWRDnumber,
        customerNumber: customerNumber,
        Smname: Smname,
        Smid: Smid,
        SMWRDnumber: SMWRDnumber,
        status: myStatus,
        recordingstartedon: recordingstartedon,
        wavFileName: custSm == "cust" ? custWavFileName : smWavFileName,
        commonFileName: commonWavFileName,
        recordingWrd: custSm == "cust" ? customersWRDnumber : SMWRDnumber,
        ip: custSm == "cust" ? custIp : smIp
      },
      dataType: "json"
    });

    request.done(function(msg) {
      console.log("DB_REC_START:(" + custSm + ") Insert successful:" + JSON.stringify(msg));
    });

    request.fail(function() {
      console.log("DB_REC_START:(" + custSm + ") DB Insert Failed :");
    });
  }
  /***********************************************************************
   * Method to call API to update Recording details to DB while stopping a WRD
   ***********************************************************************/
  function updateStopRecordingDetails(status, custSm) {
    console.log("DB_REC_STOP:Requested:REC_STATUS:" + status);

    let request = $.ajax({
      url: "/api/db/recording/stop",
      method: "POST",
      data: {
        status: status,
        wavFileName: custSm == "cust" ? custWavFileName : smWavFileName
      },
      dataType: "json"
    });

    request.done(function(msg) {
      console.log("DB_REC_STOP:(" + custSm + ") Insert successful:" + JSON.stringify(msg));
    });

    request.fail(function() {
      console.log("DB_REC_STOP:(" + custSm + ") DB Insert Failed :");
    });
  }

  /***********************************************************************
   * Call to shutdown WRD
   ***********************************************************************/
  $("#btn-cust-shutdown").click(function() {
    wrdShutdownCmd(customersWRDnumber, "cust");
  });
  $("#btn-sm-shutdown").click(function() {
    wrdShutdownCmd(SMWRDnumber, "sm");
  });

  function wrdShutdownCmd(wrd, custSm) {
    console.log("CMD_SHUTDOWN_WRD:Sending Request for WRD: " + wrd + "");
    showAlert("info", "Please wait.....sending your shutdown request");
    let request = $.ajax({
      url: "/api/wrd/cmd/shutdown",
      method: "POST",
      data: {
        wrd: wrd
      }
      //dataType: "json"
    });

    request
      .done(function(msg) {
        if (msg == "Success") {
          showAlert(
            "success",
            "The " +
              (custSm == "cust" ? "Customer's" : "Sales Manager's") +
              " WRD was sent the request successfully. It will shutdown automatically in 60 seconds"
          );
          console.log("CMD_SHUTDOWN_WRD_RESULT:Successful:" + JSON.stringify(msg));
        } else {
          showAlert(
            "danger",
            "The " +
              (custSm == "cust" ? "Customer's" : "Sales Manager's") +
              " WRD could not be shutdown due to a technical problem. Please refresh the page and try again"
          );
          console.log("CMD_SHUTDOWN_WRD_RESULT:Failure:" + JSON.stringify(msg));
        }
      })
      .fail(function(msg, err) {
        console.log("CMD_SHUTDOWN_WRD_RESULT:Error:" + JSON.stringify(msg));
        showAlert(
          "danger",
          "The " +
            (custSm == "cust" ? "Customer's" : "Sales Manager's") +
            " WRD could not be shutdown due to a technical problem. Please refresh the page and try again"
        );
      });
  }
  /*******************************************
   * Upload filenames to salesforce
   * ****************************************/
  function uploadFilenamesToSalesforce() {
    let sfData = {
      eventId: eventId,
        custWavFileName: AWS_S3_URL+custWavFileName+".mp3",
        smWavFileName: AWS_S3_URL+smWavFileName+".mp3",
        commonFileName: AWS_S3_URL+commonWavFileName+".mp3"
    };
    if (custWavFileName.length <= 1 || smWavFileName.length <= 1 || commonWavFileName.length <= 1) {
      console.log("SF_UPLOAD_FILENAMES:Wave file name not defined");
      showAlert("warning", "Filename cannot be uploaded before starting a recording");
    } else {
      showAlert("info", "Please wait.....linking the recorded files with SalesForce");
      let request = $.ajax({
        url: "/api/sf/recordedFileset/",
        method: "POST",
        timeout: 8000,
        data: sfData,
        dataType: "json"
      });
      console.log("SF_UPLOAD_FILENAMES:Sending Request: " + JSON.stringify(sfData));

      request
        .done(function(msg) {
          if (msg == "Success") {
            showAlert("success", "The following files were linked to salesforce successfully. <br> Note: The files are currently being uploaded. It may take 5 to 10 minutes until they are uploaded completely." + "\n<br><a href='" + AWS_S3_URL + custWavFileName + ".mp3" + "'>Customer's Recording</a>" + "\n<br><a href='" + AWS_S3_URL + smWavFileName + ".mp3" + "'>Sales Manager's Recording</a>" + "\n<br><a href='" + AWS_S3_URL + commonWavFileName + ".mp3" + "'>Combined Recording</a>");

            console.log("SF_UPLOAD_FILENAMES:Successful:" + JSON.stringify(msg));
          } else {
            showAlert("danger", "FIles were NOT uploaded successfully");
            console.log("SF_UPLOAD_FILENAMES:Failure:" + JSON.stringify(msg));
          }
        })
        .fail(function(msg, err) {
          console.log("SF_UPLOAD_FILENAMES:Error:" + JSON.stringify(msg));
          showAlert("danger", "There was an error in sending a request to upload files to salesforce");
        });
    }
  }

  /*******************************************
   * Get recording status for WRDs
   * ****************************************/
  function getWrdStatus(wrd, custSm) {
    showAlert("info", "Please wait, retreiving WRD Status");
    console.log("DB_GET_REC_STATUS:Sending Request:(" + custSm + ") For WRD:" + wrd);
    let url_fetchStatus = "/api/db/recording/wrd/" + wrd + "/status/";
    let request = $.get(url_fetchStatus);

    request
      .done(function(msg) {
        hideAlert();
        console.log(
          "DB_GET_REC_STATUS:Response received:(" + custSm + ") For WRD:" + wrd + " status:" + JSON.stringify(msg)
        );
        let isRecordingStarted = msg.status == "Started";
        if (custSm == "cust") {
          custWavFileName = msg.wavFileName;
        } else {
          smWavFileName = msg.wavFileName;
        }
        if (isRecordingStarted) {
          $("#" + custSm + "-recordStatus").val("Started");
          $("#" + custSm + "-recordStatus").css("color", "green");

          if (custSm == "sm") {
            $("#wrdControlSwitch").prop("checked", true);
          }
        } else if (!isRecordingStarted) {
          $("#" + custSm + "-recordStatus").val("Stopped");
          $("#" + custSm + "-recordStatus").css("color", "grey");
          if (custSm == "sm") {
            $("#wrdControlSwitch").prop("checked", false);
          }
        }
      })
      .fail(function(msg, err) {
        showAlert("warning", "Trouble connecting to the database. Please refresh and try again");
        console.log("DB_GET_REC_STATUS:Call Failed:(" + custSm + ") For WRD:" + wrd + " error:" + JSON.stringify(msg));
        $("#" + custSm + "-recordStatus").val("Stopped");
        $("#" + custSm + "-recordStatus").css("color", "grey");
        $("#wrdControlSwitch").prop("checked", false);
      });
  }
});

/***********************************************************************
 * Utility functions for misc functions
 ***********************************************************************/

//Get time format for unique ID
function getFormattedTime() {
  var today = new Date();
  return moment(today).format("YYYYMMDDHHmmssSSS");
}

//Reset UI after loading is finished
function resetLoadingUI() {
  $("#wrdControlSwitch").prop("disabled", false);
  hideLoader();
  $("#wrdControlSwitch").prop("checked", !$("#wrdControlSwitch").is(":checked"));
}

//Add bootstrap alert to the web page
function showAlert(type, value) {
  $("#alert_container").html(
    '<div id="myAlert" class=" alert alert-' +
      type +
      ' alert-dismissable fade show" role="alert"><a class="close" data-dismiss="alert">×</a><span>' +
      value +
      "</span></div>"
  );
}

//remove the bootstrap alert
function hideAlert() {
  $("#alert_container").html("");
}

//Add a spinning loader
function showLoader() {
  $("#loader_container").html("<div class='loader'></div>");
}

//Remove the spinning loader
function hideLoader() {
  $("#loader_container").html("");
}

function isTouchDevice() {
  return true == ("ontouchstart" in window || (window.DocumentTouch && document instanceof DocumentTouch));
}
window.onerror = function(message, file, line) {
  console.log("An error occured at line " + line + " of " + file + ": " + message);
};
