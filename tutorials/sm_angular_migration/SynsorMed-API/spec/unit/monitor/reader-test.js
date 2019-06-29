'use strict';

var expect = require('chai').expect;
var reader = require('../../../server/api/rest/monitor/measurements/reader');
describe('Module: Reader works if', function(){

    it('It exists', function(){
        expect(reader).to.be.ok;
    });

    var results = {
        'data': {
            'Blood Pressure': { '25 Jun 2015': '130/79', '24 Jun 2015': '120/89', '19 Jun 2015': '126/87' },
            'Glucose (mg/dL)': {'12 Aug 2015': 79, '11 Aug 2015': 97, '25 Jun 2015': 80}
        }
    };

    it('It reads blood pressure data', function() {
        var mesurement = {'name': 'blood pressure'};
        var result = {date: '25 Jun 2015', reading: '130/79' };
        expect(reader(mesurement, 'ihealth', results)).to.eql(result);
        expect(reader(mesurement, 'ihealth', results, true)).to.deep.equal(results.data['Blood Pressure']);
    });

    it('It reads glucose data', function() {
        var mesurement = {'name': 'glucose'};
        var result = { date: '12 Aug 2015', reading: 79 };
        expect(reader(mesurement, 'ihealth', results)).to.deep.equal(result);
        expect(reader(mesurement, 'ihealth', results, true)).to.deep.equal(results.data['Glucose (mg/dL)']);
    });
    it('It returns false for wrong measurement name', function() {
        var mesurement = {'name': 'html'};
        expect(reader(mesurement, 'ihealth', results)).to.be.false;
        expect(reader(false, 'ihealth', results)).to.be.false;
    });
});
