angular.module('synsormed.services.quickBlox', [

])
.service('synsormed.services.QuickBlox', ['$q', 'env', function ($q, env) {
    return {
            initialize: function(sessionToken){
                if(QB.webrtc) return; // if already initialized
                var QBConfig = {
                    webrtc: {
                        disconnectTimeInterval: 7
                    }
                };
                // return QB.init(sessionToken, env.appID, null, qbConfig);
                //QB.init(sessionToken, false, false, QBConfig);
                //QB.service.getSession().application_id = env.appID;
                QB.init(sessionToken, 41633);
            },
            startCall: function(session){
                var extension = {};
                session.call(extension, function(error) {
                    console.log(error);
                });
            },
            createSession: function(calleeIds){
                var sessionType = QB.webrtc.CallType.VIDEO;
                return QB.webrtc.createNewSession(calleeIds, sessionType);
            },
            getUserMedia: function(currentSession){
                var defer = $q.defer();
                var contraints = {
                	audio: true,
                	video: true,
                	options: {
                        muted: true,
                        mirror: true
                    }
                	};
                currentSession.getUserMedia(contraints, function(err, stream) {
                    if(err) return defer.reject(err);

                    var audioStream = stream.getAudioTracks();
                    var videoStream = stream.getVideoTracks();
                    if(!audioStream.length) return defer.reject({code:404, device:'audio', message:'Microphone not detected. Please connect microphone and try again.'});
                    if(!videoStream.length) return defer.reject({code:404, device:'video', message:'Camera not detected. Please connect camera and try again.'});

                    else return defer.resolve(stream);
                });
                return defer.promise;
            },
            connectUser: function(userId, password){
                var defer = $q.defer();
                QB.chat.connect({userId: userId, password: password}, function(err, roster) {
                    if(err) defer.reject(err);
                    else defer.resolve(roster);
                });

                return defer.promise;
            }

    };
}]);
