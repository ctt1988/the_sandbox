angular.module('synsormed.env', [])
    .value('synsormed.env.weemo.appId', 'ukjegju45xsp')

     .value('synsormed.env.urlBase', {
       env: 'http://api-staging.synsormed.com'
     })  /* mobile app */
    // .value('synsormed.env.urlBase', {
    //   env: 'http://api-chart.synsormed.com'
    // }) /* chart mobile app */
    // .value('synsormed.env.urlBase', {
    //   env: 'http://api-staging.synsormed.com'
    // }) /* stage mobile app */
    //.value('synsormed.env.urlBase', {
    //  env: 'http://api-test-synsormed.herokuapp.com'
    // }) /* mobile app test server
    // .value('synsormed.env.urlBase', {
    //   env: 'http://10.0.2.2:9000'
    // }) /* emulator */
    // .value('synsormed.env.urlBase', {
    //   env: 'http://127.0.0.1:9000'
    // }) /* local */

    .value('synsormed.env.googleFit', true) /* Enable GoogleFit Feature */
    //.value('synsormed.env.googleFit', false) /* Disable GoogleFit Feature */

    //in milliseconds, refresh grade of network in all application , 0 network cost
    .value('synsormed.env.network.scan.check', 1000) //in milliseconds

    //in milliseconds, time after which network will be scanned to refresh grade , high network cost
    .value('synsormed.env.network.scan.interval', 20000) // in milliseconds

    // android senderID for push notifications
    .value('synsormed.env.androidSenderId', '586253251790')

    .constant('synsormed.env.url', ['http://api.synsormed.com', 'http://api-chart.synsormed.com', 'http://api-staging.synsormed.com', 'http://api-test-synsormed.herokuapp.com', 'http://127.0.0.1:9000']);

    //.value('synsormed.env.urlBase', 'http://api.synsormed.com') /* mobile app */
    //.value('synsormed.env.urlBase', 'http://api-chart.synsormed.com') /* chart mobile app */
    //.value('synsormed.env.urlBase', 'http://api-staging.synsormed.com') /* stage mobile app */
    //.value('synsormed.env.urlBase', 'http://api-test-synsormed.herokuapp.com') /* mobile app test server */
    //.value('synsormed.env.urlBase', 'http://10.0.2.2:9000') /* emulator */
    //.value('synsormed.env.urlBase', 'http://127.0.0.1:9000') /* local */
