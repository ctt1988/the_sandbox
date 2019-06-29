'use strict';

// Production specific configuration
// =================================

module.exports = {
    apiDomain: 'synsormed-prod.herokuapp.com',
    apiURI: 'https://synsormed-prod.herokuapp.com', //http://synsormed-prod.herokuapp.com
    ip: process.env.OPENSHIFT_NODEJS_IP ||
        process.env.IP ||
        undefined,
    port: process.env.OPENSHIFT_NODEJS_PORT ||
        process.env.PORT ||
        8080,
    googleMapApiKey: process.env.GOOGLE_MAP_API_KEY || null
};
