'use strict';

var expect = require('chai').expect;
var models = require('models');

describe('Model: MonitorMeasurment Working If', function(){
    var measurement = null, oauthMonitorToken = null;

    before(function(){
        return models.OauthMonitorToken.create({
            monitor_id: 217,
            service_name: 'test_service',
            oauth_data:'data'
        })
        .then(function(result){
            oauthMonitorToken = result;
            return models.MeasurementMonitor.create({
                measurement_id: 1,
                monitor_id: 217,
                upperbound: '100',
                lowerbound: '150',
                sensitivity: 2,
                oauth_id: result.id,
                repeat_within_seconds: 86400,
                latest_reading: '14'
            });
        })
        .then(function(res){
            measurement = res;
        });
    });

    it('exists', function(){
        expect(models.MeasurementMonitor).to.be.ok;
    });

    it('Function: isOutofBounds works', function(){
        expect(measurement.isOutofBounds()).to.be.true;
    });

    it('Function: isMissed works', function(){
        expect(measurement.isMissed()).to.be.false;
    });

    it('Function: missedSeverity works', function(){
        expect(measurement.missedSeverity()).to.be.false;
    });

    it('Function: getAuthData works', function(done){
        measurement.getAuthData()
        .then(function(res){
            var service = res.service_name;
            var data = res.oauth_data;
            var updatedAt = res.updated_at;
            expect(service).to.eql('test_service');
            expect(data).to.eql('data');
            expect(updatedAt).to.be.ok;
            done();
        })
        .catch(done);
    });

    after(function(){
        return require('q').all([
            measurement.destroy({force: true}),
            oauthMonitorToken.destroy({force: true})
        ]);
    });
});
