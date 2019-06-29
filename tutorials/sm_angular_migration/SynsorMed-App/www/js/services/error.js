angular.module('synsormed.services.error', [])
    .service('synsormed.services.error.generic', function () {
        return function (errMessage) {
            this.message = errMessage;
            this.toString = function () {
                return this.message;
            };
        };
    })
    .service('synsormed.services.error.http', [function () {
        return function (err) {
            this.code = err.code;
            this.message = err.data;
            this.toString = function () {
                if(this.message) { return this.message; }
                switch(this.code) {
                    case 0: return "Connection timed out"; break;
                    case 401: return "Unauthorized"; break;
                    case 404: return "Not found"; break;
                    case 500: return "Server error"; break;
                    default: return "Generic server error"; break;
                }
            };
        };
    }]);
