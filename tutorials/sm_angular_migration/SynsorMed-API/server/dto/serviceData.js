'use strict';

module.exports = {
    marshal: function(data){
        return data;
    },
    unmarshal: function(rawData){
        return {
            monitor_id: rawData.monitorId,
            data: rawData.data,
            service_name: 'synsormed'
        };
    }
};
