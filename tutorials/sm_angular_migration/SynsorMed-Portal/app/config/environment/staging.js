'use strict';

// Stage specific configuration
// =================================

module.exports = {
    apiDomain: 'api-staging.synsormed.com',
    apiURI: 'http://api-staging.synsormed.com', //http://synsormed-stage.herokuapp.com
    ip: process.env.OPENSHIFT_NODEJS_IP ||
        process.env.IP ||
        undefined,

    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT ||
        process.env.PORT ||
        8080,
    googleMapApiKey: process.env.GOOGLE_MAP_API_KEY || null
};
