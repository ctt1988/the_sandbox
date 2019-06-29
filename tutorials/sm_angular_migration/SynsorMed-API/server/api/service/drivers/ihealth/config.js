"use strict";
var config = {
   development: {
     client_id: "9f78c76d8ec04a659d65db537407f1a3",
     client_secret: "cd31a43a9ea54edfb5d98e3082cc6b99",
     SC: "50D8847B95384F649029EAC8DEFBD52F",
     SV: {
       OpenApiBP: "0C30DE931E49410A965E7961121B2F59",
       OpenApiBG: "53FF607C493D4660A0888FCDA3DCA126",
       OpenApiSpO2: "AFFC05A7D8E9482A87CC8C5C435FBE8C",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631A80F411C8C21B1F0D6858039"
     }
   },
   staging: {
     client_id: "6032513d46344c86a163dbbfbcb01f68",
     client_secret: "2b4d404f39404f438d1faac8875e3a65",
     SC: "50D8847B95384F649029EAC8DEFBD52F",
     SV: {
       OpenApiBP: "0C30DE931E49410A965E7961121B2F59",
       OpenApiBG: "53FF607C493D4660A0888FCDA3DCA126",
       OpenApiSpO2: "AFFC05A7D8E9482A87CC8C5C435FBE8C",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631A80F411C8C21B1F0D6858039"
     }
   },
   production: {
     client_id: "cc63f715dcd94ee1b5b3c6b9a5476385",
     client_secret: "7ee66eb4276d4a44bb4d3e2ce7052617",
     SC: "50D8847B95384F649029EAC8DEFBD52F",
     SV: {
       OpenApiBP: "0C30DE931E49410A965E7961121B2F59",
       OpenApiBG: "53FF607C493D4660A0888FCDA3DCA126",
       OpenApiSpO2: "AFFC05A7D8E9482A87CC8C5C435FBE8C",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631A80F411C8C21B1F0D6858039"
     }
 },
 test: {
   client_id: "62516f47c2fa490aaf8346311a08d6a0",
   client_secret: "b090bee2b49d4f85b41fe329b708bc36",
   SC: "50d8847b95384f649029eac8defbd52f",
   SV: {
       OpenApiBP: "0c30de931e49410a965e7961121b2f59",
       OpenApiBG: "53ff607c493d4660a0888fcda3dca126",
       OpenApiSpO2: "affc05a7d8e9482a87cc8c5c435fbe8c",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631a80f411c8c21b1f0d6858039"
   }
 }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
