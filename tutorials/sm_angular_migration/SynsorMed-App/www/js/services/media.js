angular.module('synsormed.services.media', [])
    .service('media', function () {

        var MediaWrapper = function (src, successCB, errorCB, statusCB) {

            if(!window.device && !window.device.platform) {
                return new Audio(src);
            }

            var uri = (window.device.platform == 'Android' ? '/android_asset/www/' : '') + src;
            console.log(uri);

            var mediaObj;
            if(window.device && window.device.platform === 'Android') {
                mediaObj = new Media(uri, successCB, errorCB, statusCB);
            } else {
                mediaObj = new Audio();
                mediaObj.src = uri;
                mediaObj.addEventListener('error', errorCB);

                mediaObj.addEventListener('playing', successCB);

                mediaObj.addEventListener('ended', function () {
                    //We really only care about whether or not it's over right now.
                    statusCB(MediaWrapper.MEDIA_STOPPED);
                });
            }

            var forceLoop = function (status) {
                if(status === MediaWrapper.MEDIA_STOPPED && isPlaying) {
                    mediaObj.play();
                }
            }

            this.play = function () {
                mediaObj.play();
            }
            this.pause = function () {
                mediaObj.pause();
            }
            this.stop = function () {
                mediaObj.stop();
                mediaObj.removeEventListener('ended', forceLoop);
            }
            this.loop = function () {
                if(typeof mediaObj == Audio) {
                    mediaObj.loop = true;
                } else if(!forceMediaEventListener) {
                    forceMediaEventListener = true;
                    mediaObj.addEventListener('ended', forceLoop);
                }
            }
        };

        if(window.Media) {
            MediaWrapper.MEDIA_NONE = Media.MEDIA_NONE;
            MediaWrapper.MEDIA_STARTING = Media.MEDIA_STARTING;
            MediaWrapper.MEDIA_RUNNING = Media.MEDIA_RUNNING;
            MediaWrapper.MEDIA_PAUSED = Media.MEDIA_PAUSED;
            MediaWrapper.MEDIA_STOPPED = Media.MEDIA_STOPPED;
        } else {
            MediaWrapper.MEDIA_NONE = 0;
            MediaWrapper.MEDIA_STARTING = 1;
            MediaWrapper.MEDIA_RUNNING = 2;
            MediaWrapper.MEDIA_PAUSED = 3;
            MediaWrapper.MEDIA_STOPPED = 4;
        }

        return MediaWrapper;
    })