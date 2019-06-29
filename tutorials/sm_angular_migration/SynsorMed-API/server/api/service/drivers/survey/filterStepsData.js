'use strict';

var _ = require('lodash');
var models = require('models');
var units = require('../base/units');


module.exports = function(data, fetchDays){
  var returns = {};
  _.forEach(data, function(val){
    val['value'] = isNaN(val['value']) ? val['value'] : (val['value']);
    val['value'] = parseInt(val['value']);

    var tmpKey = units.getISOFormattedDate(val['endDate']);
    returns[units.getFormattedDateTime(val['endDate'])]= val['value'];
  })
  return returns;
};
