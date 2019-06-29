'use strict';

var _ = require('lodash');
var io = null;

module.exports = {
  setIo : function(socket){
    io = socket;
  },
  emitData : function(eventName, data){
    console.log('*************In emitdata')
    io.emit(eventName, data);
  },
}
