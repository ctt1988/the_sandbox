'use strict';

var config = require('config');
var path      = require('path');

module.exports = function (grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks

  grunt.initConfig({

    dbUrl: config.get('db.uri'),

    dbConfig: path.join(process.cwd(), '/config/config.js'),

    shell: {
      //migrate: {command: 'node_modules/\.bin/\sequelize db:migrate --url=<%= dbUrl %>'},
      migrate : {command: 'node_modules/\.bin/\sequelize db:migrate --config=<%= dbConfig %>'},
      genMigration: {command: 'node_modules/\.bin/\sequelize migration:generate --config=<%= dbConfig %>'}
    }
  });

  require('./test/seed')(grunt);

  grunt.loadNpmTasks('grunt-shell');
};
