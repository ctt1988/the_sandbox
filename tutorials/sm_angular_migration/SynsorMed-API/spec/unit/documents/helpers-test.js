'use strict';

var moment = require('moment');
var expect = require('chai').expect;
var helpers = require('../../../server/api/rest/monitor/documents/helpers');

describe('Module: Document Helpers works if', function(){
    it('It exists', function(){
        expect(true).to.eql(true);
    });

    var data = [
        {
            id: 3,
            diseases_id: 1,
            org_id: 1,
            day: 1,
            files: '["1.1.textone.txt","1.2.texttwo.txt"]',
            Disease: { name: 'hypertension'}
        },
        {
            id: 4,
            diseases_id: 1,
            org_id: 1,
            day: 2,
            files: '["2.1.pdfsample.pdf"]',
            Disease: { name: 'hypertension'}
        },
        {
            id: 5,
            diseases_id: 3,
            org_id: 1,
            day: 3,
            files: '["3.1.textfile.txt"]',
            Disease: { name: 'obesity'}
        },
        {
            id: 6,
            diseases_id: 3,
            org_id: 1,
            day: 4,
            files: '["4.1.powerpoint.ppt"]',
            Disease: { name: 'obesity'}
        }
    ];

    var readFiles = [{
        diseases_id: 1,
        files: ['1.1.textone.txt']
    }];


    it('Function: getDiseasesIds works', function(){
        expect(helpers.getDiseasesIds(data)).to.eql([1, 3]);
    });

    it('Function: getAllDocuments works', function(){
        var today = moment();
        var startDate = today.subtract(2, 'days');
        expect(helpers.getAllDocuments(data, startDate)).to.eql([
            { diseases_id: 1, files: [ '1.1.textone.txt', '1.2.texttwo.txt'] },
            { diseases_id: 3, files: [ '3.1.textfile.txt'] }
        ]);
    });

    it('Function: combineDocuments works', function(){
        var files = [
            { diseases_id: 1, files: [ '1.1.textone.txt' ] },
            { diseases_id: 3, files: [ '3.1.textfile.txt' ] }
        ];
        var unReadFiles = [
            { diseases_id: 1, files: ['3.1.x.pdf'] },
            { diseases_id:3, files: ['2.1.sample.txt'] }
        ];
        expect(helpers.combineDocuments(files, unReadFiles, [1, 3])).to.eql([
            {  diseases_id: 1, files: ['1.1.textone.txt', '3.1.x.pdf'] },
            { diseases_id: 3, files: ['3.1.textfile.txt', '2.1.sample.txt'] }
        ]);
        expect(helpers.combineDocuments(files, readFiles, [1, 3], true)).to.eql([
            {  diseases_id: 1, files: [] },
            {  diseases_id: 3, files: [ '3.1.textfile.txt' ] }
        ]);
    });

    it('Function: insertNewFile works', function(){
        var files = [];
        expect(helpers.insertNewFile(files, 1, '1.2.test.txt')).to.eql({
            already_read: false,
            files: [{
                diseases_id: 1,
                files: ['1.2.test.txt']
            }]
        });
    });

    it('Function: mapInfo works', function(){
        var documents = [
            {  diseases_id: 1, files: ['1.2.texttwo.txt'] },
            {  diseases_id: 3, files: ['3.1.textfile.txt'] }
        ];
         expect(helpers.mapInfo(documents, data, readFiles)).to.eql([
            { diseases_id: 1, files: ['1.2.texttwo.txt'], disease_name: 'hypertension', read_files: ['1.1.textone.txt']},
            { diseases_id: 3, files: ['3.1.textfile.txt'], disease_name: 'obesity', read_files: [] }
         ]);
    });
});
