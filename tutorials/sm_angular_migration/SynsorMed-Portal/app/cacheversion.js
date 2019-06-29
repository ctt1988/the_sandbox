module.exports = function(){
    //Need to modify the /routes/index.js as well
    var packageMod = require('../package.json');
    var cacheVersion = '.v' + packageMod.cacheVersion;
    return cacheVersion;
};
