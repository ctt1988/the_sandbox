'use strict';

var moment = require('moment');
var expect = require('chai').expect;
var unit = require('../../../server/api/service/drivers/base/units');

describe('The Unit Module works if ', function(){

    it('It exists', function(){
        expect(unit).to.be.ok;
    });

    it('Function: getFormattedDate Works', function(){
        var date = new Date('12/04/1990');
        expect(unit.getFormattedDate(date)).to.equal('4 Dec 1990');
    });

    it('Function: getUnitConverted Works', function(){
        expect(unit.getUnitConverted(233, 'height')).to.equal('233 centimeters');
        expect(unit.getUnitConverted(0, 'weight')).to.equal('0 kilograms');
        expect(unit.getUnitConverted(1, 'distance')).to.equal('1 kilometer');
        expect(unit.getUnitConverted(2, 'weight')).to.equal('2 kilograms');
        expect(unit.getUnitConverted(43, 'weight', 'en_US')).to.equal('43 lbs');
        expect(unit.getUnitConverted(0, 'weight', 'en_US')).to.equal('0 lbs');
        expect(unit.getUnitConverted(1, 'weight', 'en_US')).to.equal('1 lb');
        expect(unit.getUnitConverted(34, 'weight', 'en_GB')).to.equal('34 stones');
        expect(unit.getUnitConverted(323, 'weight', 'METRIC')).to.equal('323 kilograms');
        expect(unit.getUnitConverted(233, 'non-existing')).to.equal(233);
    });

    it('Function: getRoundOff Works', function(){
        expect(unit.getRoundOff(4.50)).to.equal('4.5');
        expect(unit.getRoundOff(4.22)).to.equal('4');
        expect(unit.getRoundOff(4.77)).to.equal('5');
        expect(unit.getRoundOff(4.74)).to.equal('4.5');
        expect(unit.getRoundOff(4.26)).to.equal('4.5');
        expect(unit.getRoundOff()).to.equal(null);
        expect(unit.getRoundOff(0)).to.equal('0');
        expect(unit.getRoundOff('asc')).to.equal(null);
    });

    it('Function: getGreatestDate Works', function(){
        var data = [
            {'dateTime':'2015-04-27', 'value':5490},
            {'dateTime':'2015-04-28', 'value':2344},
            {'dateTime':'2015-04-29', 'value':2779},
            {'dateTime':'2015-04-30', 'value':9196},
            {'dateTime':'2015-05-01', 'value':15828},
            {'dateTime':'2015-05-02', 'value':1945},
            {'dateTime':'2015-05-03', 'value':366},
            {'dateTime':'2015-05-04', 'value':0}
        ];

        expect(unit.getGreatestDate()).to.be.false;
        expect(unit.getGreatestDate(data)).to.be.false;
        expect(unit.getGreatestDate(data, 'dateTime')).to.deep.equal(moment('2015-05-04'));
        expect(unit.getGreatestDate(data, 'dateTime', 'value')).to.deep.equal(moment('2015-05-03'));
    });

});
