'use strict';
var db = require('models');
var monitorTableName = db.Monitor.getTableName();
var measurementMonitorTableName = db.MeasurementMonitor.getTableName();

module.exports = {
  up: function(migration, DataTypes, done) {
      var query = 'UPDATE `' + measurementMonitorTableName + '` SET  `' + measurementMonitorTableName + '`.`repeat_within_seconds` = ( SELECT  `' + monitorTableName + '`.`repeat_within_seconds`' +
      'FROM  `' + monitorTableName + '`' +
      'WHERE  `' + monitorTableName + '`.`id` =  `' + measurementMonitorTableName + '`.`monitor_id` AND `' + monitorTableName + '`.`repeat_within_seconds` IS NOT NULL ) , `' + measurementMonitorTableName + '`.`next_reading` = (' +
      'SELECT  `' + monitorTableName + '`.`next_reading`' +
      'FROM  `' + monitorTableName + '`' +
      'WHERE  `' + monitorTableName + '`.`id` =  `' + measurementMonitorTableName + '`.`monitor_id` AND `' + monitorTableName + '`.`next_reading` IS NOT NULL )' +
      'WHERE  `' + measurementMonitorTableName + '`.`repeat_within_seconds` IS NULL ' +
      'OR  `' + measurementMonitorTableName + '`.`next_reading` IS NULL ' +
      'AND `' + measurementMonitorTableName + '`.`deleted_at` IS NULL';

      db.sequelize.query(query)
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function(migration, DataTypes, done) {
     done();
  }
};
