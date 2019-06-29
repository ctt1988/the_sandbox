"use strict";
var config = {
   development: {
     client_id: "229FYZ",
     client_secret: "8aae0aae43d14b7ebdff8e5bd241cc47",
     client_key: "d2165a5b0eae4198a1fab074e6979695"
   },
   staging: {
       client_id: "229RDQ",
       client_secret: "ac3465cd45fb11454339091a1504703c",
       client_key: "a1fc9d21756faee32493524550cc2f9b"
   },
   production: {
       client_id: "229WLP",
       client_secret: "9edcf16d9e482479994f1fc501a1619e",
       client_key: "6910aa83638804a73a6d65f2d507fcde"
   },
   test: {
     client_id: "22B2QS",
     client_key: "cd6a23075bee4de07b6102f24b1fcba0",
     client_secret: "9798d47e1a120882c698067d1ea68517"
   }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
