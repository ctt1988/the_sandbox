'use strict';

var _ = require('lodash');

//get latest reading and its date from data supplied by picking first key-value pair.
var getData = function(data)
{
    if(_.isEmpty(data)) return false;

    var date = Object.keys(data)[0];
    return {'date': date, 'reading': data[date]};
};

module.exports = function(measurement, serviceName, results, allData)
{
    var response = false;
    if(!measurement) return response;

    switch (measurement.name.toLowerCase()) {
        case 'blood pressure':
            response =  !allData ? getData(results.data['Blood Pressure']) : results.data['Blood Pressure'];
        break;

        case 'steps':
            response = !allData ? getData(results.data.Steps) : results.data.Steps;
        break;

        case 'sleep':
            response = !allData ? getData(results.data.Sleep) : results.data.Sleep;
        break;

        case 'glucose':
            response = !allData ? getData(results.data['Glucose (mg/dL)']) : results.data['Glucose (mg/dL)'];
        break;

        case 'weight':
            response = !allData ? getData(results.data['weight']) : results.data['weight'];
        break;

        case 'heartrate':
            response = !allData ? getData(results.data['Heart Rate (bpm)']) : results.data['Heart Rate (bpm)'];
        break;

        case 'temperature':
            response = !allData ? getData(results.data['temperature']) : results.data['temperature'];
        break;

        case 'breath':
            response = !allData ? getData(results.data['breath (bpm)']) : results.data['breath (bpm)'];
        break;

        case 'oxygen flow':
            response = !allData ? getData(results.data['Oxygen Flow Rate (lpm)']) : results.data['Oxygen Flow Rate (lpm)'];
            var response2 = !allData ? getData(results.data['Oxygen Purity (%)']) : results.data['Oxygen Purity (%)'];
            if(response && response2){
                _.forEach(response, function(value, index){
                    if(!_.isUndefined(response2[index])) response[index] = {'oxygen flow': value, 'oxygen purity': response2[index]};
                });
            }
        break;

        case 'hours':
            response = !allData ? getData(results.data['hours']) : results.data['hours'];
        break;

        case 'alerts':
            response = !allData ? getData(results.data['alerts']) : results.data['alerts'];
        break;

        case 'alarms':
            response = !allData ? getData(results.data['alarms']) : results.data['alarms'];
        break;

        case 'caloric intake':
            response = !allData ? getData(results.data['caloric intake']) : results.data['caloric intake'];
        break;

        case 'serial number':
            response = !allData ? results.data['serial number'] : results.data['serial number'];
        break;

        case 'oxygen saturation':
            response = !allData ? getData(results.data['oxygen saturation']) : results.data['oxygen saturation'];
        break;
        case 'status':
            response = !allData ? results.data['status'] : results.data['status'];
        break;
        case 'peak flow rate' :
            response = !allData ? getData(results.data['Peak Flow Rate (L/min)']) : results.data['Peak Flow Rate (L/min)'];
        break;
        default:
            response = false;
    }
    return response;
};
