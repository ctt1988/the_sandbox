'use strict';

var Q = require('q');
var pdf = require('html-pdf');
var moment = require('moment');

module.exports.patientSummaryReport = function(res, data){
    var defer = Q.defer();
    data.dob = data.dob ? moment(data.dob).format('MMM-DD-YYYY') : 'N/A';
    res.renderPartials({
          patient_summary_pdf: { data: data }
    }, function(err, html){
        if(err || !html) return defer.reject(err);
        var options = { format: 'A4' };
        pdf.create(html.patient_summary_pdf, options).toStream(function(err, stream){
            if(err)  defer.reject(err);
             defer.resolve(stream);
        });
    });

    return defer.promise;
};
