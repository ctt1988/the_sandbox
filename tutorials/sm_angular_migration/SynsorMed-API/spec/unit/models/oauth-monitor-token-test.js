'use strict';

var expect = require('chai').expect;
var Support = require('../support.js');
var OuathMonitorToken = Support.models.OauthMonitorToken;

describe('Model: OauthMonitorToken works if ', function(){
     it('It exists', function(){
         expect(OuathMonitorToken).to.be.ok;
     });
});
