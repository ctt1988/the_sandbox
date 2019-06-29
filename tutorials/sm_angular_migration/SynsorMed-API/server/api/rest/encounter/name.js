var router = require('express').Router();

router.get('/', function (req, res) {
    if(req.session && req.session.rtccode)
    {
        res.send(req.session.rtccode);
    }
    else {
        res.status(403).send(false);
    }
});

module.exports = router;
