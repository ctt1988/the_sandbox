'use strict';

angular.module('synsormed.directives.dragdrop', [])
.directive('modaldraggable', [
    '$document',
    '$timeout',
    function ($document, $timeout) {
        return {
            restrict: 'A',
            link: function (scope, actualElement, attrs){
                var element = $(actualElement).parents('.modal-dialog');
                var leftMargin = Math.max(0, ((window.innerWidth - element.outerWidth()) / 2) );
                $(element).parents('.modal').css({height: '0px', width: '0px'});
                element.css({ position: 'fixed', cursor: 'move', left: leftMargin + 'px' });
                var startX = 0, startY = 0, x = leftMargin, y = 0;

                var mousemove = function(event){
                    x = event.screenX - startX;
                    y = event.screenY - startY;
                    element.css({ top: y + 'px', left: x + 'px' });
                };

                var mouseup = function() {
                    $document.unbind('mousemove', mousemove);
                    $document.unbind('mouseup', mouseup);
                };

                var mousedown = function(event){
                    event.preventDefault(); // Prevent default dragging of selected content
                    startX = event.screenX - x;
                    startY = event.screenY - y;
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                };

                element.on('mousedown', mousedown);
            }
        };
    }
]);
