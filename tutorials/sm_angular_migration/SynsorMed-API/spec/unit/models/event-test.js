'use strict';

var expect = require('chai').expect;
var Support = require('../support.js');
var Event = Support.models.Event;

describe('Model: Event works if ', function(){
    it('It exists', function(){
        expect(Event).to.be.ok;
    });

    it('Function: createDocumentEvent works', function(done){
        Event.createDocumentEvent(1, 'test')
        .then(function(documentEvent){
            expect(documentEvent.object_type).to.eql('monitor');
            expect(documentEvent.type).to.be.eql('document_read');
            return documentEvent.destroy({force: true});
        })
        .then(function(){
            done();
        })
        .catch(done);
    });

    it('Function: createDataRecieveEvent works', function(done){
        Event.createDataRecieveEvent(1, 'test')
        .then(function(documentEvent){
            expect(documentEvent.object_type).to.eql('measurement');
            expect(documentEvent.type).to.be.eql('data_recieved');
            return documentEvent.destroy({force: true});
        })
        .then(function(){
            done();
        })
        .catch(done);
    });

    it('Function: createDataUploadEvent works', function(done){
        Event.createDataUploadEvent(1, 'test')
        .then(function(documentEvent){
            expect(documentEvent.object_type).to.eql('monitor');
            expect(documentEvent.type).to.be.eql('data_upload');
            return documentEvent.destroy({force: true});
        })
        .then(function(){
            done();
        })
        .catch(done);
    });
});
