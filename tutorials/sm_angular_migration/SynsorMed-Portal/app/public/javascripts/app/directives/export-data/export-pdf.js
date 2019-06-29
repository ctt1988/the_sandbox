'use strict';

angular.module('synsormed.directives.exportPDF',[])
.directive('exportToPdf',function(){
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {

            element.bind('click', function(e){
                var target = attrs.exportToPdf;
                if(!target) return;
                var table = $('#'+target);
                var tableOrigWidth = table.width();
                var a4  =[ 595.28,  841.89];
                var title = attrs.pdfTitle || 'SynsorMed Title';

                var getCanvas = function(){
                    table.width((a4[0]*1.33333) -80).css({'max-width':'none'});
                    return html2canvas(table,{imageTimeout:2000, removeContainer:true });
                };

                var centeredText = function(doc, text, y) {
                    var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                    var textOffset = (doc.internal.pageSize.width - textWidth) / 2;
                    doc.text(textOffset, y, text);
                };

                scope.$emit('wait:start');
                getCanvas()
                .then(function(canvas){
                    table.width(tableOrigWidth);
                    var img = canvas.toDataURL("image/png"),
                    doc = new jsPDF({unit:'px',format:'a4'});
                    centeredText(doc, title, 25);
                    doc.addImage(img, 'JPEG', 20, 35);
                    doc.save(target+'.pdf');
                    scope.$emit('wait:stop');
                })
                .catch(function(){
                    table.width(tableOrigWidth);
                    scope.$emit('wait:stop');
                });
                table.width(tableOrigWidth);
            });
        }
    }
});
