"use strict";
var config = {
   development: {
     client_id: "tBM1ztueGBnPGgcC",
     client_secret: "Yfgk2DNoGVO8xtX1kD2CLk8fz8tAO5IZ"
   },
   staging: {
       client_id: "6xkWAkYnNxfBPBeo",
       client_secret: "lPsgXob8I0yrv5F9Q3yieDBbAeVptD4L"
   },
   production: {
       client_id: "9NaMbjJ6ausHiv0p",
       client_secret: "VaqUIlfp3MyWDDARjuyIUO1UrmuICpph"
 },
 test: {
     client_id: "tBM1ztueGBnPGgcC",
     client_secret: "Yfgk2DNoGVO8xtX1kD2CLk8fz8tAO5IZ"
 }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
