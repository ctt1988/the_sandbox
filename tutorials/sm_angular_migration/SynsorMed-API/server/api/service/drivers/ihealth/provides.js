var Provider = require('../base/base').Provider;
var config = {
    name: 'ihealth',
    url: 'http://www.ihealth.com',
    display: 'iHealth',
    version: 2,
    meta_data: {
        appInfo: {
            ios: { name: 'iHealthMyVitalsAHA://' },
            android: { name: 'com.iHealth'}
        }
    }
};

function iHealthProvider(config){
  Provider.call(this, config);
}
require('util').inherits(iHealthProvider, Provider);
var currentProvider = new iHealthProvider(config);

currentProvider /* Tell what services does this driver provides */
.addMeasurement('glucose')
.addMeasurement('weight')
.addMeasurement('blood pressure')
.addMeasurement('steps')
.addMeasurement('oxygen saturation');

module.exports = currentProvider.getConfig();
