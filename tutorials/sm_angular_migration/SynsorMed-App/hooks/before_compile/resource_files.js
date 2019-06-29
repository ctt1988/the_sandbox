#!/usr/bin/env node

//
// This hook copies various resource files from our version control system directories into the appropriate platform specific location
//

// configure all the files to copy.  Key of object is the source file, value is the destination location.  It's fine to put all platforms' icons and splash screen files here, even if we don't build for all platforms on each developer's box.
var filestocopy = {
		//Android Files
		//Icon
        "config/android/res/drawable-hdpi/appicon.png": "platforms/android/res/drawable-hdpi/icon.png",
        "config/android/res/drawable-ldpi/appicon.png": "platforms/android/res/drawable-ldpi/icon.png",
        "config/android/res/drawable-mdpi/appicon.png": ["platforms/android/res/drawable-mdpi/icon.png", "platforms/android/res/drawable/icon.png"],
        "config/android/res/drawable-xhdpi/appicon.png": "platforms/android/res/drawable-xhdpi/icon.png",
        "config/android/res/drawable-xxhdpi/appicon.png": "platforms/android/res/drawable-xxhdpi/icon.png",
        //Splash
        "config/android/res/drawable-hdpi/splash.png": "platforms/android/res/drawable-hdpi/splash.png",
        "config/android/res/drawable-ldpi/splash.png": "platforms/android/res/drawable-ldpi/splash.png",
        "config/android/res/drawable-mdpi/splash.png": ["platforms/android/res/drawable-mdpi/splash.png", "platforms/android/res/drawable/splash.png"],
        "config/android/res/drawable-xhdpi/splash.png": "platforms/android/res/drawable-xhdpi/splash.png",
        "config/android/res/drawable-xxhdpi/splash.png": "platforms/android/res/drawable-xxhdpi/splash.png",
        
        //IOS Files
        //Icon
        "config/ios/Resources/icons/Icon-Small.png": "platforms/ios/Synsormed/Resources/icons/icon-small.png",
        "config/ios/Resources/icons/Icon-Small@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-small@2x.png",
        "config/ios/Resources/icons/Icon-40.png": "platforms/ios/Synsormed/Resources/icons/icon-40.png",
        "config/ios/Resources/icons/Icon-40@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-40@2x.png",
        "config/ios/Resources/icons/Icon-50.png": "platforms/ios/Synsormed/Resources/icons/icon-50.png",
        "config/ios/Resources/icons/Icon-50@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-50@2x.png",
        "config/ios/Resources/icons/Icon-60.png": "platforms/ios/Synsormed/Resources/icons/icon-60.png",
        "config/ios/Resources/icons/Icon-60@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-60@2x.png",
        "config/ios/Resources/icons/Icon-72.png": "platforms/ios/Synsormed/Resources/icons/icon-72.png",
        "config/ios/Resources/icons/Icon-72@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-72@2x.png",
        "config/ios/Resources/icons/Icon-76.png": "platforms/ios/Synsormed/Resources/icons/icon-76.png",
        "config/ios/Resources/icons/Icon-76@2x.png": "platforms/ios/Synsormed/Resources/icons/icon-76@2x.png",
        "config/ios/Resources/icons/Icon.png": "platforms/ios/Synsormed/Resources/icons/icon.png",
        "config/ios/Resources/icons/Icon@2x.png": "platforms/ios/Synsormed/Resources/icons/icon@2x.png",
        
        //Splash
        "config/ios/Resources/splash/Default-667h.png": "platforms/ios/Synsormed/Resources/splash/Default-667h.png",
        "config/ios/Resources/splash/Default-736h.png": "platforms/ios/Synsormed/Resources/splash/Default-736h.png",
        "config/ios/Resources/splash/Default-Landscape-736h.png": "platforms/ios/Synsormed/Resources/splash/Default-Landscape-736h.png",
        "config/ios/Resources/splash/Default-568h@2x~iphone.png": "platforms/ios/Synsormed/Resources/splash/Default-568h@2x~iphone.png",
        "config/ios/Resources/splash/Default-Landscape@2x~ipad.png": "platforms/ios/Synsormed/Resources/splash/Default-Landscape@2x~ipad.png",
        "config/ios/Resources/splash/Default-Landscape~ipad.png": "platforms/ios/Synsormed/Resources/splash/Default-Landscape~ipad.png",
        "config/ios/Resources/splash/Default-Portrait@2x~ipad.png": "platforms/ios/Synsormed/Resources/splash/Default-Portrait@2x~ipad.png",
        "config/ios/Resources/splash/Default-Portrait~ipad.png": "platforms/ios/Synsormed/Resources/splash/Default-Portrait~ipad.png",
        "config/ios/Resources/splash/Default@2x~iphone.png": "platforms/ios/Synsormed/Resources/splash/Default@2x~iphone.png",
        "config/ios/Resources/splash/Default~iphone.png": "platforms/ios/Synsormed/Resources/splash/Default~iphone.png"
    };

var fs = require('fs');
var path = require('path');

// no need to configure below
var rootdir = process.argv[2];

function copyFile(src, dest) {
    
//    console.log("copying "+srcfile+" to "+destfile);
    var destdir = path.dirname(dest);
    
    if(!fs.existsSync(destdir)) {
        console.log("Directory " + destdir + " does not exist")
    }
    if(!fs.existsSync(srcfile)) {
        console.log("File " + src + " does not exist")
    }
    
    if (fs.existsSync(src) && fs.existsSync(destdir)) {
        var res = fs.createReadStream(src).pipe(fs.createWriteStream(dest));
    }
}

for(var key in filestocopy) {
    var val = filestocopy[key];
    var srcfile = path.join(rootdir, key);
    if(val instanceof Array) {
        for(var i = 0, l = val.length; i < l; i++) {
            copyFile(srcfile, path.join(rootdir, val[i]));
        }
    } else {
        var destfile = path.join(rootdir, val);
        copyFile(srcfile, destfile);
    }
}
