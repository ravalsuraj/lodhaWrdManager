const config = require("./../config");

exports.get_home = function (req, res) {

    res.render("index", {
        custName: req.query.custName,
        custNum: req.query.custNum,
        custWrd: req.query.custWrd,
        smName: req.query.smName,
        smId: req.query.smId,
        smWrd: req.query.smWrd,
        eventId: req.query.eventId,
      config: {
            aws: {
                s3: {
                    url: config.aws.s3.url || "https://s3.amazonaws.com/audiocapture/"
                }
            },
            wrd: {
                port: config.wrd.port || 8080,
                timeout: config.wrd.port || 8080,
                rate: config.wrd.rate || "48000",
                channels: config.wrd.channels || "1",
                frames_per_buffer: config.wrd.frames_per_buffer || "2400"
            }
        }
    });
}


exports.mock_serve_StartRecording = function (req, res) {
    setTimeout(function sendSucess() {
        res.send("Success");
    }, 500);
};

exports.mock_serve_StopRecording = function (req, res) {
    setTimeout(function sendSucess() {
        res.send("Success");
    }, 500);
}

exports.mock_serve_shutdown = function (req, res) {
    setTimeout(function sendSucess() {
        res.send("Success");
    }, 1000);
};
