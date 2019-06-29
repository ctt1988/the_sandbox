'use strict';

// Stage specific configuration
// =================================

module.exports = {
    apiDomain: 'synsormed-demo.herokuapp.com',
    apiURI: 'http://synsormed-demo.herokuapp.com', //http://synsormed-stage.herokuapp.com
    ip: process.env.OPENSHIFT_NODEJS_IP ||
        process.env.IP ||
        undefined,

    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT ||
        process.env.PORT ||
        8080,
    googleMapApiKey: process.env.GOOGLE_MAP_API_KEY || null
};
