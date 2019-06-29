/**
 * Created by Stephen on 7/1/2014.
 */

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser());
/**
 * CORS for development
 */
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('origin'));
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

var router = express.Router();

router.post('/auth/patient', function (req, res) {
    var code = req.body.code.toUpperCase();
    console.log(code)
    if(code === 'PASS') {
        return res.json({
            id: 200,
            success: true,
            callerId: 'kdfskadfkljf',
            providerId: 500,
            paid: true,
            type: 'PATIENT',
            code: req.body.code
        });
    }
    if(code === 'UNPAID') {
        return res.json({
            id: 100,
            success: true,
            callerId: 'ckljaj3jl',
            providerId: 500,
            paid: false,
            type: 'PATIENT',
            code: req.body.code
        });
    }

    switch(code) {
        case 'FAILTIME':
            setTimeout(function () {
                res.json({success: false}); //You should timeout before this happens
            }, 5 * 60 * 1000);
            break;
        case 'FAIL401':
            res.send(401, "Code not found");
            break;
        default:
        case 'FAIL500':
            res.send(500, "Server error");
            break;
    }
});

router.post('/auth/provider', function (req, res) {
    if(req.body.email === 'test@test.com' && req.body.password == 'password') {
        return res.json({
            id: 500,
            callerId: 'mnasdfjklk',
            type: 'PROVIDER',
            name: "Dr. Jones"
        });
    }
    res.send(401, "Unauthorized");
});

router.post('/pay', function (req, res) {
    console.log(req.body)
    res.json({
		success: true
	});
})
router.post('/logging/time', function (req, res) {

    res.send(204);
})
router.get('/patients', function (req, res) {

    var time1 = new Date();
    time1.setMinutes(time1.getMinutes() - 15);
    var time2 = new Date();
    time2.setMinutes(time2.getMinutes() - 30);

    res.json([
        {code: 'PASS', providerId: 500, callerId: 'kdfskadfkljf', startedWaitingOn: time1.getTime()},
        {code: 'UNPAID', providerId: 500, callerId: 'ckljaj3jl', startedWaitingOn: time2.getTime()}
    ]);
});


var note = {};
router.get('/patients/:id/note', function (req, res) {
    res.json(note);
});
router.post('/patients/:id/note', function (req, res) {
    note = req.body;
    note.patientCode = req.params.code;
    console.log(note);
    res.json(note);
});

router.get('/patients/:code/survey', function (req, res) {
    res.json([
        {id: 1, question: "Question 1"},
        {id: 2, question: "Question 2"},
        {id: 3, question: "Question 3"},
        {id: 4, question: "Question 4"},
        {id: 5, question: "Question 5"}
    ]);
});

var answers = [];
router.get('/patients/:id/answers', function (req, res) {
    res.json(answers);
});
router.post('/patients/:id/answers', function (req, res) {
    answers = req.body;
    res.json(answers);
});

router.get('/providers/:id/worklist', function (req, res) {

    var date = new Date();
    var time1, time2, time3, time4, time5;
    time1 = date.getTime();
    date.setMinutes(date.getMinutes() + 30);
    time2 = date.getTime();
    date.setMinutes(date.getMinutes() + 30);
    time3 = date.getTime();
    date.setMinutes(date.getMinutes() + 30);
    time4 = date.getTime();
    date.setMinutes(date.getMinutes() + 30);
    time5 = date.getTime();

    res.json([
        {id: 100, code: 'PASS', appointmentTime: time1, reason: "Too many shoes"},
        {id: 110, code: 'kj32jkla', appointmentTime: time2, reason: "Lightbulb syndrome"},
        {id: 200, code: 'UNPAID', appointmentTime: time3, reason: "Tony Soprano"},
        {id: 210, code: 'adklj32a', appointmentTime: time4, reason: "Basejumping"},
        {id: 220, code: 'ioerioql', appointmentTime: time5, reason: "Etiam feugiat leo orci, quis pretium orci vestibulum vel. Vestibulum molestie ornare feugiat. Phasellus vel ultrices arcu. Sed et lectus at est convallis pulvinar et posuere velit. Quisque vitae velit sit amet mauris consectetur commodo. Cras bibendum lectus mauris. Sed non viverra enim. Ut cursus ultrices nunc eu elementum. Ut vulputate vitae felis iaculis vulputate. Pellentesque ornare luctus lacus."}
    ]);
});

router.get('/providers/:id', function (req, res) {
    //You'd check here to see what kind of user is requesting the information

    var online = false;
    if(new Date().getSeconds() > 30) {
        online = true;
    }

    return res.json({
        id: 500,
        online: online,
        type: 'PROVIDER',
        name: "Dr. Jones"
    });
});

router.post('/providers/forgotpass', function (req, res) {
    if(req.body.email === 'no@no') {
        return res.send(404);
    }
    res.json({
        success: true
    });
});

router.get('/v1/service', function (req, res) {
    return res.json({
      "fitbit" : { "title" : "Fitbit", "url" : "http://fitbit.com" },
      "sightcall" : { "title" : "Sightcall", "url" : "http://sightcall.com" },
    });
});

app.use(router);

var server = app.listen(8891, function() {
    console.log('Listening on port %d', server.address().port);
});
