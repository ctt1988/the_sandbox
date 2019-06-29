'use strict';
var _ = require('lodash');

module.exports = {
    marshal: function(diseasesModel){
       return {
           id: diseasesModel.id,
           name: _.capitalize(diseasesModel.name)
       };
    },
    unmarshal: function(rawData){
        return {
            id: rawData.id,
            name: rawData.name
        };
    }
};
