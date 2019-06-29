'use strict';

var path = require('path');
var models = require('models');
var router = require('express').Router();

router.post('/upload', function(req, res){
    return res.send(':)');
});

router.get('/ping', function(req, res){
    if(req.session && req.session.monitorCode){
        logMonitor(req.session.monitorCode);
    }
    return res.send('');
});

router.get('/download/1', function(req, res){
    var file = path.join(__dirname, '/media/100.jpg');
    res.download(file);
});

router.get('/download/2', function(req, res){
    var file = path.join(__dirname, '/media/250.jpeg');
    res.download(file);
});

router.get('/download/3', function(req, res){
    var file = path.join(__dirname, '/media/500.jpeg');
    res.download(file);
});

function logMonitor(code){
    return models.Monitor.find({
        where: {
            patient_code: {
                like: code
            }
        }
    })
    .then(function(monitor){
        if(!monitor) return false; //monitor is null sometime if like don't match
        return monitor.update({ last_activity: new Date() });
    })
    .catch(function(err){
        console.log(err);
        return err;
    });
}

module.exports = router;
