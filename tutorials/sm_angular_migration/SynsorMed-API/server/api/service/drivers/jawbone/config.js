"use strict";
var config = {
   development: {
     client_id: "tmR265bv-ck",
     client_secret: "23bc206a1a5323c53d4ee03f7e7dc5ca8fd7d664"
   },
   staging: {
       client_id: "jSyiGaHU3ok",
       client_secret: "39c54a1d883a691f13b08aa1bf9207d803873316"
   },
   production: {
       client_id: "aR-S8xhiiDU",
       client_secret: "abfd18710e68b1c59ea355c3e22a14cebb7ee3bc"
   },
   test: {
     client_id: "tmR265bv-ck",
     client_secret: "23bc206a1a5323c53d4ee03f7e7dc5ca8fd7d664"
   }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
