'use strict';

var expect = require('chai').expect;
var healthkit = require('../../../server/api/service/drivers/healthkit');

describe('Service: Healthkit works if ', function(){

    var oauthData = {
        days: 30,
        steps: [{
            'endDate': '2015-06-01 18:05:00',
            'quantity': 8452,
            'startDate': '2015-06-01 18:05:00'
        }],
        pulse: [{
            'endDate': '2015-06-11 14:52:00',
            'quantity': 75
        }, {
            'endDate': '2015-06-11 14:42:00',
            'quantity': 78
        }, {
            'endDate': '2015-06-01 14:43:00',
            'quantity': 69
        }, {
            'endDate': '2015-05-14 13:38:00',
            'quantity': 85
        }]
    };

    it('It exists', function(){
        expect(healthkit).to.be.ok;
    });

    it('It can parse healthkit data', function(done){
        healthkit.profile(oauthData)
        .then(function(parsedData){
            expect(parsedData).to.be.ok;
            expect(parsedData.data.Steps['1 Jun 2015']).to.eql(8452);
            expect(parsedData.data['Heart Rate (bpm)']['1 Jun 2015 14:43:00']).to.eql(69);
            done();
        })
        .catch(done);
    });

});
