'use strict';

var _ = require('lodash');

function Provider(config){
    config = config || {};

    this.name = config.name;
    this.url  = config.url;
    this.display = config.display;
    this.version = config.version;
    this.description = config.description;
    this.config = config.config;
    this.meta_data = config.meta_data || null;
    this.provides = [];
    this.meta_data = config.meta_data || null;
}

Provider.prototype.addMeasurement = function(measurement){
    this.provides.push(measurement);
    return this;
};

Provider.prototype.getConfig = function(){
    return _.omit({
        name : this.name,
        url : this.url,
        display  : this.display,
        version : this.version,
        description : this.description,
        config : this.config,
        provides : this.provides,
        meta_data : this.meta_data ? JSON.stringify(this.meta_data) : null
      }, function(v){
        return v === null || v === undefined;
    });
};


module.exports = {
    Provider : Provider
};
