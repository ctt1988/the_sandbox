angular.module('synsormed.directives.exportCSV',[])
.directive('exportToCsv',function(){
  	return {
    	restrict: 'A',
    	link: function (scope, element, attrs) {
			
			console.log('inside export file');

	        element.bind('click', function(e){
                var target = attrs.exportToCsv;
				if(!target) return;
				
				var table = document.getElementById(target);
				if(!table) return ;
				
				var csvString = '';

					for(var i=0; i<table.rows.length;i++){
						var rowData = table.rows[i].cells;
						for(var j=0; j<rowData.length;j++){
							csvString = csvString + rowData[j].innerHTML + ",";
						}
						csvString = csvString.substring(0,csvString.length - 1);
						csvString = csvString + "\n";
					}

	         	csvString = csvString.substring(0, csvString.length - 1);
	         	var a = $('<a/>', {
		            style:'display:none',
		            href:'data:application/octet-stream;base64,'+btoa(csvString),
		            download: target+'.csv'
		        }).appendTo('body')
		        a[0].click()
		        a.remove();
	        });
    	}
  	}
});
