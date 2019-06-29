'use strict';

// Test specific configuration
// ===========================
module.exports = {
    apiDomain: 'api-test-synsormed.herokuapp.com',
    apiURI: 'https://api-test-synsormed.herokuapp.com',//'http://api.synsormed.com', //http://synsormed-prod.herokuapp.com
    ip: process.env.OPENSHIFT_NODEJS_IP ||
        process.env.IP ||
        undefined,
    port: process.env.OPENSHIFT_NODEJS_PORT ||
        process.env.PORT ||
        8080,
    googleMapApiKey: process.env.GOOGLE_MAP_API_KEY || null
};
