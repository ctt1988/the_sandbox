'use strict';

var expect = require('chai').expect;
var adapter = require('../../../server/api/service/drivers/jawbone/adapter');

describe('Service: Jawbone works if ', function(){

   it('It exists', function(){
        expect(adapter).to.be.ok;
   });

   it('It can parse Sleep data', function(){
        var sleepData = {
            'items':[{
                    'xid': '40F7_htRRnQ6_IpPSk0pow',
                    'title': 'for 6h 46m',
                    'sub_type': 0,
                    'time_created': 1384963500,
                    'time_completed': 1385099220,
                    'date': 20131121,
                    'place_lat': '37.451572',
                    'place_lon': '-122.184435',
                    'place_acc': 10,
                    'place_name': 'My House',
                    'details':
                    {
                        'smart_alarm_fire': 1385049600,
                        'awake_time': 1385049573,
                        'asleep_time': 1385023259,
                        'awakenings': 2,
                        'rem': 0,
                        'light': 8340,
                        'deep': 16044,
                        'awake': 3516,
                        'duration': 600,
                        'tz': 'America/Los_Angeles'
                    }
                }, {
                    'xid': '40F7_htRRnQ6_IpPSk0pow',
                    'title': 'for 6h 46m',
                    'sub_type': 0,
                    'time_created': 1384963500,
                    'time_completed': 1385099220,
                    'date': 20131121,
                    'place_lat': '37.451572',
                    'place_lon': '-122.184435',
                    'place_acc': 10,
                    'place_name': 'My House',
                    'details':
                    {
                        'smart_alarm_fire': 1385049600,
                        'awake_time': 1385049573,
                        'asleep_time': 1385023259,
                        'awakenings': 2,
                        'rem': 0,
                        'light': 8340,
                        'deep': 16044,
                        'awake': 3516,
                        'duration': 600,
                        'tz': 'America/Los_Angeles'
                    }
                },
                {
                    'xid': '40F7_htRRnQ6_IpPSk0pow',
                    'title': 'for 6h 46m',
                    'sub_type': 0,
                    'time_created': 1385000500,
                    'time_completed': 1385099220,
                    'date': 20131124,
                    'place_lat': '37.451572',
                    'place_lon': '-122.184435',
                    'place_acc': 10,
                    'place_name': 'My House',
                    'details':
                    {
                        'smart_alarm_fire': 1385049600,
                        'awake_time': 1385049573,
                        'asleep_time': 1385023259,
                        'awakenings': 2,
                        'rem': 0,
                        'light': 8340,
                        'deep': 16044,
                        'awake': 3516,
                        'duration': 700,
                        'tz': 'America/Los_Angeles'
                    }
                }]};
                var parsedData = adapter.parseAll(10, sleepData, null, null, null);
                expect(parsedData.Sleep).not.to.be.null;
                expect(parsedData.Sleep['20 Nov 2013']).to.eql(0.34);
                expect(parsedData.Sleep['21 Nov 2013']).to.eql(0.19);
            });

            it('It can parse Steps data', function(){

                var stepsData = {
                    'items':
                    [{
                        'xid': '40F7_htRRnT8Vo7nRBZO1X',
                        'title': 'Run',
                        'type': 'workout',
                        'sub_type': 2,
                        'time_created': 1384963500,
                        'time_updated': 1385049599,
                        'time_completed': 1385099220,
                        'date': 20131121,
                        'place_lat': '37.451572',
                        'place_lon': '-122.184435',
                        'place_acc': 10,
                        'place_name': 'Gym',
                        'details': {
                            'steps': 5128,
                            'time': 2460,
                            'bg_active_time': 2163,
                            'meters': 5116,
                            'km': 5.116,
                            'intensity': 3,
                            'calories': 691,
                            'bmr': 56.071321076,
                            'bg_calories': 448.95380111,
                            'bmr_calories': 56.071321076,
                            'tz': 'America/Los_Angeles'
                        }
                    },
                    {
                        'xid': '40F7_htRRnT8Vo7nRBZO1X',
                        'title': 'Run',
                        'type': 'workout',
                        'sub_type': 2,
                        'time_created': 1384963500,
                        'time_updated': 1385049599,
                        'time_completed': 1385099220,
                        'date': 20131121,
                        'place_lat': '37.451572',
                        'place_lon': '-122.184435',
                        'place_acc': 10,
                        'place_name': 'Gym',
                        'details': {
                            'steps': 5128,
                            'time': 2460,
                            'bg_active_time': 2163,
                            'meters': 5116,
                            'km': 5.116,
                            'intensity': 3,
                            'calories': 691,
                            'bmr': 56.071321076,
                            'bg_calories': 448.95380111,
                            'bmr_calories': 56.071321076,
                            'tz': 'America/Los_Angeles'
                        }
                    },
                    {
                        'xid': '40F7_htRRnT8Vo7nRBZO1X',
                        'title': 'Run',
                        'type': 'workout',
                        'sub_type': 2,
                        'time_created': 1384963500,
                        'time_updated': 1385049599,
                        'time_completed': 1385099220,
                        'date': 20131121,
                        'place_lat': '37.451572',
                        'place_lon': '-122.184435',
                        'place_acc': 10,
                        'place_name': 'Gym',
                        'details': {
                            'steps': 5128,
                            'time': 2460,
                            'bg_active_time': 2163,
                            'meters': 5116,
                            'km': 5.116,
                            'intensity': 3,
                            'calories': 691,
                            'bmr': 56.071321076,
                            'bg_calories': 448.95380111,
                            'bmr_calories': 56.071321076,
                            'tz': 'America/Los_Angeles'
                        }
                    },
                    {
                        'xid': '40F7_htRRnT8Vo7nRBZO1X',
                        'title': 'Run',
                        'type': 'workout',
                        'sub_type': 2,
                        'time_created': 1385000500,
                        'time_updated': 1385049599,
                        'time_completed': 1385099220,
                        'date': 20131121,
                        'place_lat': '37.451572',
                        'place_lon': '-122.184435',
                        'place_acc': 10,
                        'place_name': 'Gym',
                        'details': {
                            'steps': 700,
                            'time': 2460,
                            'bg_active_time': 2163,
                            'meters': 5116,
                            'km': 5.116,
                            'intensity': 3,
                            'calories': 691,
                            'bmr': 56.071321076,
                            'bg_calories': 448.95380111,
                            'bmr_calories': 56.071321076,
                            'tz': 'America/Los_Angeles'
                        }
                    }
                ]};
                var parsedData = adapter.parseAll(10, null, stepsData, null, null);
                expect(parsedData.Steps).not.to.be.null;
                expect(parsedData.Steps['20 Nov 2013']).to.eql(15384);
                expect(parsedData.Steps['21 Nov 2013']).to.eql(700);
        });
});
