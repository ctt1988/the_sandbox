'use strict';

var models = require('models');

module.exports = function(monitorId, service_name){
   return models.ServiceData.findOne({
       where: {
           monitor_id: monitorId,
           service_name: service_name
       }
   })
   .then(function(data){
       return {
           data: data && data.service_data ? JSON.parse(data.service_data) : {},
           syncDate: data ? data.updated_at : false
       };
   });
};
