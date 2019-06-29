/**
 * Main application routes
 */

'use strict';

module.exports = function(app) {

    // Insert routes below
    app.use('/v1/', require('./routes/v1'));

    //Network testing services, independent of api versions
    app.use('/network/', require('./api/network'));

    app.use(function (err, req, res, next) {
        if (err.code !== 'EBADCSRFTOKEN'){
          return next(err);
        }

        // handle CSRF token errors here
        res.status(403);
        res.send('session has expired or form tampered with');
    });
};
