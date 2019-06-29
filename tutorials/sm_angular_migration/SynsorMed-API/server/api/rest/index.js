var router = require('express').Router();

router.use('/provider', require('./provider'));
router.use('/encounter', require('./encounter'));
router.use('/practice', require('./practice'));
router.use('/user', require('./user'));
router.use('/status', require('./status'));
router.use('/insights', require('./insights'));
router.use('/measurement', require('./measurement'));
router.use('/monitor', require('./monitor'));
router.use('/networks', require('./network'));
router.use('/patient', require('./patient'));
router.use('/diseases', require('./diseases'));
router.use('/report', require('./report'));
router.use('/location', require('./location'));
router.use('/notification', require('./notification'));
router.use('/serviceProvider', require('./serviceProvider'));
router.use('/upload', require('./upload'));

module.exports = router;
