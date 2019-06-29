'use strict';

angular.module('synsormed.services.healthkit',[])
.service('synsormed.services.healthkit.HealthkitService',[
    '$q',
    function($q){
        //check if plugin is available
        var checkHealthkitPlugin = function(){
            if( ((window.plugins || {}).healthkit == undefined) ){
                console.error("Healthkit Plugin not found. Please install https://github.com/Telerik-Verified-Plugins/HealthKit.git");
                return false;
            } else {
                return true;
            }
        };

        //these are the permission which we will ask the user
        //HKQuantityTypeIdentifierBasalBodyTemperature
        var AUTH_SIGNATURE =   {
            'readTypes'  : ['HKQuantityTypeIdentifierBodyMass','HKQuantityTypeIdentifierStepCount','HKQuantityTypeIdentifierHeartRate','HKQuantityTypeIdentifierBodyTemperature', 'HKQuantityTypeIdentifierRespiratoryRate'],
            'writeTypes'  : ['HKQuantityTypeIdentifierBodyMass','HKQuantityTypeIdentifierStepCount','HKQuantityTypeIdentifierHeartRate','HKQuantityTypeIdentifierBodyTemperature', 'HKQuantityTypeIdentifierRespiratoryRate']
        };

        //check on startup if healthkit plugin is loaded
        checkHealthkitPlugin();

        /**
        *filter the data according to minutes specified
        *@param data is array of objects
        *@param minutes is the time interval for which function will fetch gretest entry
        */

        var filterDataAccordingToTime = function(data, minutes){
             var dateFormat = 'YYYY-MM-DD HH:mm:ss';
                 minutes = minutes ? minutes : 14;

             var formatDate = function (date) {
                 var d = new Date(date.replace(' ', 'T')),
                 month = '' + (d.getMonth() + 1),
                 day = '' + d.getDate(),
                 year = d.getFullYear();
                 if (month.length < 2) month = '0' + month;
                 if (day.length < 2) day = '0' + day;

                 return [year, month, day].join('-');
             };

             var addMinute = function (date, amount, sub){
                 var d = new Date(date.replace(' ', 'T'));
                 sub = sub || false;
                 amount = parseInt(amount) * (sub ? -1 : 1);
                 d.setMinutes(d.getMinutes() + amount);
                 d.setSeconds(0);
                 return d;
             }

             var arrangeDataAccordingToDate = function(allData){
                 var temp = {};
                 allData.forEach(function(dataObj){
                     var key = formatDate(dataObj.startDate);
                     temp[key] = temp[key] || [];
                     temp[key].push(dataObj);
                 });
                 return temp;
             };

             var findGreatestReading = function(dayData){
                 var gretestReading = 0;
                 var grestestObject = false;

                 _.forEach(dayData, function(data){
                     if(data.quantity > gretestReading){
                         grestestObject = data;
                         gretestReading = data.quantity;
                     }
                 });
                 return grestestObject;
             };

             var filterData = function(arrangedData){
                 var finalArray = [];
                 _.forEach(arrangedData, function(dayData){
                     finalArray.push(findGreatestReading(dayData));
                 });

                 return finalArray;
             };

             var arrangedDataAccordingToTime = function(arrangedData){

                 var timeCatArray = {};

                 _.forEach(arrangedData, function(dayDate, k){
                     var upperDateLimit = addMinute(dayDate[0].startDate, 1)
                     var lowerDateLimit = addMinute(dayDate[0].startDate, minutes, true);
                     var currentKey = moment(lowerDateLimit).format(dateFormat).toString();

                     dayDate.forEach(function(record, key){
                         var currentDate = new Date(record.startDate.replace(' ', 'T'));
                         if(currentDate >= lowerDateLimit && currentDate <= upperDateLimit){
                             if(!timeCatArray[currentKey]){
                                 timeCatArray[currentKey]=[];
                             }
                             timeCatArray[currentKey].push(record);
                         }
                         else{
                             upperDateLimit = addMinute(record.startDate, 1)
                             lowerDateLimit = addMinute(record.startDate, minutes, true);
                             currentKey = moment(lowerDateLimit).format(dateFormat).toString();
                             if(!timeCatArray[currentKey]){
                                 timeCatArray[currentKey]=[];
                             }
                             timeCatArray[currentKey].push(record);
                         }
                     });
                 });
                 return timeCatArray;
             };

           if(data.length){
               var arrangedData = arrangeDataAccordingToDate(data);
                   arrangedData = arrangedDataAccordingToTime(arrangedData);
               return filterData(arrangedData);
           }
           return data;
        };

        var convertToUTCDate = function(date){
            return date ? moment(date).utc().format('YYYY-MM-DD HH:mm:ss').toString() : date;
        };

        return {
            checkAuthForType : function(type,success,error){

                //check if plugin is available or not
                if(!checkHealthkitPlugin()){
                    return error(false);
                }

                window.plugins.healthkit.checkAuthStatus({
                    type : type
                },function(results){
                    //we are authorized
                    if(results === 'authorized'){
                        success(true);
                    }
                    else if(results === 'undetermined'){
                        success(null);
                    }
                    else {
                        success(false);
                    }

                },
                function(err){
                    error(err);
                });

            },

            //check if we are authorized to read data we need
            checkAuth : function(types,success,error){
                types = types || AUTH_SIGNATURE.readTypes;
                var promises = [],
                deferred = $q.defer(),
                that     = this;

                angular.forEach(types,function(val){
                    var tmp = $q.defer();
                    that.checkAuthForType(val,tmp.resolve,tmp.reject);
                    promises.push(tmp.promise);
                });

                //check if all requests accepted ot not
                $q.all(promises)
                .then(function(data){
                    var isAccepted = data.some(function(val){ return val === true; });
                    var notDetermined = data.every(function(val){ return val === null});

                    if(isAccepted){
                        success(true);
                    }
                    else if(notDetermined){
                        success(null);
                    }
                    else {
                        success(false);
                    }

                })
                .catch(function(err){
                    error(err);
                });

            },

            // is the Healthapp data available
            checkAvailable : function(){
                var deferred = $q.defer();

                if(checkHealthkitPlugin()){
                    window.plugins.healthkit.available(
                        function(){
                            deferred.resolve(true);
                        },
                        function(){
                            deferred.reject();
                        });
                    } else {
                        deferred.reject();
                    }

                    return deferred.promise;
                },
                //ask the user for permissions
                askPermissions : function(success, error){
                    var deferred = $q.defer();
                    var that = this;

                    var requestAuthorizationSuccessCallback = function(){
                        that.checkAuth(AUTH_SIGNATURE.readTypes,function(permission){
                            if(permission == true){
                                deferred.resolve(true);
                            }
                            else{
                                deferred.resolve(false);
                            }
                        },
                        function(err){
                            console.log(err);
                            deferred.reject(err);
                        });
                    };

                    var requestAuthorizationErrorCallback = function(err){
                        //user may have rejected authorization request
                        console.log(err);
                        deferred.reject(new Error("Authorization Request Rejected."));
                    };

                    window.plugins.healthkit.requestAuthorization(
                        AUTH_SIGNATURE,
                        requestAuthorizationSuccessCallback,
                        requestAuthorizationErrorCallback
                    );

                    return deferred.promise;
                },
                // check auth status, if not granted request user otherwise sliently return true
                performAuth : function(){
                    var deferred = $q.defer();
                    var that = this;

                    var checkAuthSuccessCallback = function(result){
                        //we already have the permissions
                        if(result === true){
                            deferred.resolve(true);
                        }
                        else{
                            that.askPermissions().then(function(permission){
                                deferred.resolve(permission);
                            }).catch(function(err){
                                deferred.reject(err);
                            });
                        }
                    };

                    var checkAuthFailureCallback = function(err){
                        deferred.reject(err);
                    };

                    that.checkAuth(AUTH_SIGNATURE.readTypes,checkAuthSuccessCallback,checkAuthFailureCallback);

                    return deferred.promise;
                },

                //read any HKSample type that healthkit supports
                // JSON , @query
                _readHKSampleForRange : function(query){
                    var deferred = $q.defer();

                    window.plugins.healthkit.querySampleType(query,
                        function(results){
                            deferred.resolve(results);
                        },
                        function(err){
                            deferred.resolve(null);
                        }
                    );

                    return deferred.promise;
                },

                // read healthapp data
                readWeight : function(count){

                    //by defaults for last 30 days
                    count = count || 30;

                    return this._readHKSampleForRange({
                        'startDate' : new Date(new Date().getTime()- count*24*60*60*1000), // 30 days ago
                        'endDate'   : new Date(), // now
                        'sampleType': 'HKQuantityTypeIdentifierBodyMass',
                        'unit'      : 'lb'
                    });
                },

                // read healthapp pulse data
                readPulse : function(count){
                    count = count || 30; //by defaults for last 30 days
                    var promises = [], deferred = $q.defer(), that = this;
                    var i = 0, now = new Date();

                    for(i = 0; i < count; i++){
                        var beginDate = new Date((new Date).setDate(now.getDate() - i));
                        beginDate.setHours(0,0,0,0);
                        var endDate = new Date((new Date).setDate(now.getDate() - i));
                        endDate.setHours(23,59,59,0);
                        var tmp = that._readHKSampleForRange({
                            'startDate' : beginDate,
                            'endDate'   : endDate,
                            'sampleType': 'HKQuantityTypeIdentifierHeartRate',
                            'unit'      : 'count/min',
                            'limit'     : 86400
                        });
                        promises.push(tmp);
                    }

                    //check if all requests accepted ot not
                    $q.all(promises)
                    .then(function(data){
                        //combine all data to one array
                        data = _.without(_.flatten(data), null);
                        data = filterDataAccordingToTime(data);

                        //conver startdate and endDate into utc
                        _.forEach(data, function(dayData){
                            dayData.startDate = dayData.startDate ? convertToUTCDate(dayData.startDate) : dayData.startDate;
                            dayData.endDate = dayData.endDate ? convertToUTCDate(dayData.endDate) : dayData.endDate;
                        });

                        console.log('data after converting date to utc');
                        console.log(data);

                        deferred.resolve(data);
                    })
                    .catch(function(err){
                        console.log(err);
                        deferred.resolve(null)
                    });

                    return deferred.promise;

                },

                //read the step counts
                readSteps : function(count){

                    //by defaults for last 30 days
                    count = count || 30;

                    var promises = [],
                    deferred = $q.defer(),
                    that     = this;

                    var i   = 0,
                    now = new Date();

                    for(i = 1; i <= count; i++){
                        var tempPromise = $q.defer();

                        var beginDate = new Date((new Date).setDate(now.getDate() - (i-1)));
                        beginDate.setHours(0,0,0,0);

                        var endDate = new Date((new Date).setDate(now.getDate() - (i-1)));
                        endDate.setHours(23,59,59,0);

                        var tmp = window.plugins.healthkit.sumQuantityType({
                            'startDate' : beginDate,
                            'endDate'   : endDate,
                            'sampleType': 'HKQuantityTypeIdentifierStepCount',
                            'unit'      : 'count'
                        },tempPromise.resolve,tempPromise.reject);

                        promises.push(tempPromise.promise);
                    }

                    //check if all requests accepted ot not
                    $q.all(promises)
                    .then(function(data){
                        //combine all data to one array
                        var resp  = [];
                        i = 1;
                        _.forEach(data,function(val){
                            if(val != 0){
                                var tmpDate  = new Date((new Date).setDate(now.getDate() - (i-1)));
                                tmpDate  = tmpDate.toISOString().slice(0, 19).replace('T', ' ');
                                resp.push({
                                    "quantity" : val,
                                    "startDate" : tmpDate,
                                    "endDate" : tmpDate
                                });
                            }
                            i++;
                        });

                        deferred.resolve(resp);
                    })
                    .catch(function(err){
                        console.log(err);
                        deferred.resolve(null)
                    });

                    return deferred.promise;
                },

                readTemperature : function(count){
                    //by defaults for last 30 days
                    count = count || 30;

                    return this._readHKSampleForRange({
                        'startDate' : new Date(new Date().getTime()- count*24*60*60*1000), // 30 days ago
                        'endDate'   : new Date(), // now
                        'sampleType': 'HKQuantityTypeIdentifierBodyTemperature',
                        'unit'      : 'degF'
                    });
                },

                readBreath : function(count){
                    count = count || 30;
                    var promises = [];
                    var deferred = $q.defer();
                    var that = this;
                    var i, now = new Date();

                    for(i = 0; i < count; i++){
                        var beginDate = new Date((new Date).setDate(now.getDate() - i));
                        beginDate.setHours(0,0,0,0);
                        var endDate = new Date((new Date).setDate(now.getDate() - i));
                        endDate.setHours(23,59,59,0);
                        promises.push(that._readHKSampleForRange({
                            'startDate' : beginDate,
                            'endDate'   : endDate,
                            'sampleType': 'HKQuantityTypeIdentifierRespiratoryRate',
                            'unit'      : 'count/min',
                            'limit'     : 86400
                        }));
                    }
                    $q.all(promises)
                    .then(function(data){
                           data = _.without(_.flatten(data), null); //combine all data to one array
                           data = filterDataAccordingToTime(data, 4);
                          _.forEach(data, function(dayData){ //conver startdate and endDate into utc
                              _.omit(dayData, ['metadata', 'UUID', 'sourceBundleId', 'sourceName']);
                              dayData.startDate = dayData.startDate ? convertToUTCDate(dayData.startDate) : dayData.startDate;
                              dayData.endDate = dayData.endDate ? convertToUTCDate(dayData.endDate) : dayData.endDate;
                           });
                           console.log('Breath data after converting date to utc');
                           console.log(data);
                           deferred.resolve(data);
                    })
                    .catch(function(err){
                        console.log(err);
                        deferred.resolve(null);
                    });

                    return deferred.promise;
                },

                //extract all data out of the service
                readData : function(count){

                    var deferred = $q.defer();
                    $q.all([
                        this.readSteps(count),
                        this.readWeight(count),
                        this.readPulse(count),
                        this.readTemperature(count),
                        this.readBreath(count)
                    ])
                    .then(function(data){
                        deferred.resolve({
                            steps  : data[0],
                            weight : data[1],
                            pulse  : data[2],
                            temperature : data[3],
                            breath : data[4]
                        });
                    })
                    .catch(function(err){
                        deferred.reject(err);
                    });

                    return deferred.promise;
                }
            };
}]);
