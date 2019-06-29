'use strict';

/** search a value in range , return true if found otherwise false **/
var valueCheck = function(max, min, latest){
    max = parseInt(max); min = parseInt(min); latest = parseInt(latest);
    return latest ? (min <= latest && latest <= max && min <= max) : false;
};

module.exports = function(upperbound, lowerbound, latest_reading){
    var upperboundValue = (upperbound && typeof upperbound == 'string') ? parseInt(upperbound) : upperbound;
    var lowerboundValue = (lowerbound && typeof lowerbound == 'string') ? parseInt(lowerbound) : lowerbound;
    if(upperboundValue && lowerboundValue){
        if(upperbound.indexOf('/') === -1){
            return latest_reading ? !valueCheck(upperbound, lowerbound, latest_reading) : false;   // If  no `/` found
        }
        else{
            if(!latest_reading) return false;
            var upperarr = upperbound.split('/');   // If `/` found split the values in array's
            var lowerarr = lowerbound.split('/');
            var latestarr = latest_reading.split('/');
            return !(valueCheck(upperarr[1], upperarr[0], latestarr[0]) && valueCheck(lowerarr[1], lowerarr[0], latestarr[1]));
        }
    }
    else{
        return false;
    }
};
