#!/usr/bin/env node

//this hook installs all your plugins

// add your plugins to this list--either the identifier, the filesystem location or the URL
var pluginlist = [
    "https://github.com/aminholmes/SynsorMed-QB-Plugin.git",
    "cordova-plugin-device",
    "cordova-plugin-device-motion",
    "cordova-plugin-device-orientation",
    "cordova-plugin-network-information",
    "cordova-plugin-statusbar",
    "cordova-plugin-console",
    "cordova-plugin-media",
    "cordova-plugin-inappbrowser",
    "cordova-plugin-whitelist",
    "https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git",
    "https://github.com/whiteoctober/cordova-plugin-app-version.git",
    "https://github.com/Telerik-Verified-Plugins/HealthKit.git",
    "https://github.com/randdusing/cordova-plugin-bluetoothle.git",
    "https://github.com/randdusing/cordova-plugin-background-mode-bluetooth-central.git",
    "https://github.com/lampaa/com.lampa.startapp.git",
    "https://github.com/apache/cordova-plugin-geolocation.git",
    "cordova-plugin-background-mode",
    "cordova-plugin-health"
];

// no need to configure below

var fs = require('fs');
var path = require('path');
var sys = require('sys');
var execSync = require("shelljs").exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout)
}

pluginlist.forEach(function(plug) {
    execSync("cordova plugin add " + plug, puts);
});
