'use strict';

var expect = require('chai').expect;
var Support = require('../support.js');
var Encounter = Support.models.Encounter;
var moment = Support.moment;

describe('Model: Encounter works if', function(){
    var encounterData;
    before(function(){
        return Encounter.create({
            patient_code: 'TE5TC0DE',
            last_activity: moment().subtract('15', 'minutes').format(),
            scheduled_start: moment().format(),
            call_ready: moment().format(),
            call_started: moment().add('1', 'minutes').format(),
            reason_for_visit: 'Test Encounter',
            duration: 15
        })
        .then(function(data){
            encounterData = data;
        });
    });

    it('It exists', function(){
         expect(Encounter).to.be.ok;
    });

    it('Function: getWaitingTime works', function(){
         expect(encounterData.getWaitingTime()).to.eql(60);
    });

    after(function(){
          return encounterData.destroy({force: true});
    });
});
