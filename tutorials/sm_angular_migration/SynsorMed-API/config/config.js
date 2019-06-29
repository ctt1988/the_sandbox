var fs        = require('fs');
var path      = require('path');
var config    = require('config');
var sequelize = require('models').sequelize;

module.exports = function () {
    var dbDetails = {
                         host           : sequelize.config.host,
                         username       : sequelize.config.username,
                         password       : sequelize.config.password,
                         database       : sequelize.config.database,
                         port           : sequelize.config.port
                     };
    if(config.get('db.uri').indexOf('sslca=') != -1){
        var pemFilePath = config.get('db.uri').split('sslca=')[1];
        dbDetails.migrationStorageTableName = 'sequelizemeta';
        dbDetails.dialectOptions = {
          ssl: {
             ca: fs.readFileSync(path.join(process.cwd(), pemFilePath))
          }
        };
    }
   return dbDetails;
 }();
