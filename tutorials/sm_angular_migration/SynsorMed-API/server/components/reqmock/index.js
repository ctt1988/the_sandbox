'use strict';

var config = require('config');
var baseUrl = config.get('server.baseUrl');
var protocol = config.get('ssl') ? 'https' : 'http';

var reqMock = {
  protocol: protocol,
  get: function(){
    return baseUrl;
  }
};

module.exports = reqMock;
