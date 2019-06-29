'use strict';

var expect = require('chai').expect;
var models = require('models');
var moment = require('moment');

describe('Model: Monitor Working If', function(){
    var monitorObj, measurements, MonitorData;

    before(function() {
        return models.Monitor.create({
            provider_id:1,
            notify:1,
            start_date: new Date()
        })
        .then(function(monitor){
            monitorObj = monitor;
            return  models.MeasurementMonitor.bulkCreate([{
                upperbound:'200',
                lowerbound:'100',
                sensitivity:2,
                infraction:0,
                monitor_id:monitor.id,
                repeat_within_seconds:86400,
                latest_reading: 120,
                last_recorded: moment().format('YYYY-MM-DD HH:mm:ss').toString()
            },
            {
                upperbound:'200',
                lowerbound:'100',
                sensitivity:2,
                infraction:0,
                monitor_id:monitor.id,
                oauth_id:99,
                repeat_within_seconds:86400,
                latest_reading: 99,
                last_recorded: moment().format('YYYY-MM-DD HH:mm:ss').toString()
            },
            {
                upperbound:'200',
                lowerbound:'100',
                sensitivity:2,
                infraction:0,
                monitor_id:monitor.id,
                oauth_id:67,
                repeat_within_seconds:86400,
                latest_reading: 201,
                last_recorded: moment().format('YYYY-MM-DD HH:mm:ss').toString()
            }]);
        })
        .then(function(data){
            measurements = data;
            return models.Monitor.findOne({
                where: {id:monitorObj.id}
            }).then(function(results){
                MonitorData = results;
            });
        });
    });

    it('It exists', function(){
        expect(models.Monitor).to.be.ok;
    });

    it('Function: isConnected works', function(){
        expect(MonitorData.isConnected(measurements)).to.eql(1);
    });

    it('Function: connectedRatio works', function(){
        expect(MonitorData.connectedRatio(measurements)).to.eql((2/(measurements.length)).toFixed(2));
    });

    it('Function: activeMeasurements works', function(){
        expect(MonitorData.activeMeasurements(measurements)).to.eql(2);
    });

    it('Function: getMeasurementMaps works', function(done){
        MonitorData.getMeasurementMaps()
        .then(function(results){
            expect(results.length).to.eql(3);
            done();
        });
    });

    it('Function: isOutofBounds works', function(){
        expect(MonitorData.isOutofBounds(measurements)).to.be.true;
    });

    it('Function: isMissed works', function(){
        expect(MonitorData.isMissed(measurements)).to.be.false;
    });

    after(function(){
        return models.MeasurementMonitor.destroy({
            where: {
                monitor_id: monitorObj.id
            },
            force:true
        })
        .then(function(){
            return monitorObj.destroy({force:true});
        });
    });

});
