'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var logger    = require('logger');
var config    = require('config');

var dbConnection = {
  logging : logger.sql,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  define: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

if(config.get('db.uri').indexOf('sslca=') != -1){
    var pemFilePath = config.get('db.uri').split('sslca=')[1];
    dbConnection.dialectOptions = {
        ssl  : {
            ca : fs.readFileSync(path.join(process.cwd(), pemFilePath))
        }
    };
}

var sequelize = new Sequelize(config.get('db.uri'), dbConnection);

var db = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.User.belongsTo(db.Organization, {foreignKey: 'org_id'});
db.User.belongsTo(db.CellularNetwork, {foreignKey: 'network_id'});
db.User.belongsTo(db.Role, {foreignKey: 'role_id'});
db.Encounter.belongsTo(db.User, {foreignKey: 'provider_id'});
db.User.hasMany(db.Encounter, {foreignKey: 'provider_id'});
db.Encounter.hasMany(db.EncounterSurveyAnswer, {foreignKey: 'encounter_id'});
db.Organization.hasMany(db.User, {foreignKey: 'org_id'});
db.Organization.hasMany(db.SurveyQuestion, {foreignKey: 'org_id'});
db.Organization.hasMany(db.OrganizationPreference, {foreignKey: 'org_id'});
db.SurveyQuestion.belongsTo(db.Organization, {foreignKey: 'org_id'});

db.Monitor.belongsTo(db.User, {foreignKey: 'provider_id'});
db.Monitor.belongsTo(db.Encounter, {foreignKey: 'encounter_id'});
db.Monitor.belongsToMany(db.Measurement, {through: { model: db.MeasurementMonitor, unique: false }, foreignKey: 'monitor_id'});
db.Measurement.belongsToMany(db.Monitor, {through: { model: db.MeasurementMonitor, unique: false }, foreignKey: 'measurement_id', unique: false});
db.MeasurementMonitor.belongsTo(db.Measurement, {foreignKey: 'measurement_id'});
db.MeasurementMonitor.belongsTo(db.Monitor, {foreignKey: 'monitor_id'});

db.Payment.hasMany(db.Encounter, {foreignKey: 'payment_id'});
db.Encounter.belongsTo(db.Payment, {foreignKey: 'payment_id'});

db.Encounter.belongsTo(db.RTCUser, {foreignKey: 'rtc_user_id'});
//Technically it doesn't really have 'many'.. but that's the wordage in
//sequelize.
db.RTCUser.hasMany(db.Encounter, {foreignKey: 'rtc_user_id'});

db.Monitor.hasMany(db.OauthMonitorToken, {foreignKey: 'monitor_id'});
db.OauthMonitorToken.belongsTo(db.Monitor, {foreignKey: 'monitor_id'});

db.OauthMonitorToken.hasMany(db.MeasurementMonitor, {foreignKey: 'oauth_id'});
db.MeasurementMonitor.belongsTo(db.OauthMonitorToken, {foreignKey: 'oauth_id'});

db.Measurement.belongsToMany(db.Service, {through: db.MeasurementService, foreignKey: 'measurement_id'});
db.Service.belongsToMany(db.Measurement, {through: db.MeasurementService, foreignKey: 'service_id'});

db.Patient.belongsToMany(db.User, {through: db.PatientUser, foreignKey: 'patient_id'});
db.User.belongsToMany(db.Patient, {through: db.PatientUser, foreignKey: 'provider_id'});

db.Patient.hasOne(db.Monitor, {foreignKey: 'patient_id'});
db.Monitor.belongsTo(db.Patient, {foreignKey: 'patient_id'});

db.Patient.hasOne(db.Encounter, {foreignKey: 'patient_id'});
db.Encounter.belongsTo(db.Patient, {foreignKey: 'patient_id'});

db.Diseases.hasMany(db.Document, {foreignKey: 'diseases_id'});
db.Document.belongsTo(db.Diseases, {foreignKey: 'diseases_id'});

db.Diseases.hasOne(db.MeasurementMonitor, {foreignKey: 'diseases_id'});
db.MeasurementMonitor.belongsTo(db.Diseases, {foreignKey: 'diseases_id'});

db.Organization.hasOne(db.OrganizationLeaderboard, {foreignKey: 'org_id'});
db.MeasurementMonitor.hasOne(db.LeaderboardActivities, {foreignKey: 'measurement_monitor_map_id'});
db.LeaderboardActivities.belongsTo(db.MeasurementMonitor, {foreignKey: 'measurement_monitor_map_id'});

// Status Survey Relations
db.Organization.hasMany(db.StatusSurveyQuestion, {foreignKey: 'org_id'});
db.StatusSurveyQuestion.belongsTo(db.Organization, {foreignKey: 'org_id'});

db.Organization.belongsToMany(db.StatusSurvey, {through: db.StatusSurveyOrganization, foreignKey: 'org_id'});
db.StatusSurvey.belongsToMany(db.Organization, {through: db.StatusSurveyOrganization, foreignKey: 'status_survey_id'});

db.StatusSurvey.hasMany(db.StatusSurveyQuestion, {foreignKey: 'status_survey_id'});
db.StatusSurveyQuestion.belongsTo(db.StatusSurvey, {foreignKey: 'status_survey_id'});

db.MeasurementMonitor.belongsTo(db.StatusSurvey, {foreignKey: 'status_survey_id'});

//Fix datatype level validation errors introduced in #3472
Sequelize.STRING.prototype.validate = function() { return true; };
Sequelize.INTEGER.prototype.validate = function() { return true; };
Sequelize.DECIMAL.prototype.validate = function() { return true; };
Sequelize.TEXT.prototype.validate = function() { return true; };
Sequelize.BOOLEAN.prototype.validate = function() { return true; };

db.sequelize = sequelize;
db.Sequelize = Sequelize;

logger.info('Database: Setup Done');

module.exports = db;
