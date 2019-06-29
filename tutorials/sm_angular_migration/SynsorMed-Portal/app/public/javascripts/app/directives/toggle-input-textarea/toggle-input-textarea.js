'use strict';

angular.module('synsormed.directives.toogleInputTextarea',[])
.directive('toogleInputTextarea',['$compile', function($compile){
    return {
        restrict : 'A',
        scope : {
            ngModel: '=',
        },
        link : function(scope, elm, attrs){
            if($(elm).is('input')){
                $(elm).focusin(function(){
                    var html ='<textarea ' +
                    (attrs.class ? 'class="'+attrs.class+'"'  : '') +
                    'ng-model="ngModel" toogle-input-textarea></textarea>';
                    var e =$compile(html)(scope);
                    elm.replaceWith(e);
                    $(e).focus();
                    scope.$apply();
                });
            }

            if($(elm).is('textarea')){
                $(elm).focusout(function(){
                    var html ='<input type="text" '+(attrs.class ? 'class="'+attrs.class+'"'  : '') +' ng-model="ngModel" toogle-input-textarea />';
                    var e =$compile(html)(scope);
                    elm.replaceWith(e);
                    scope.$apply();
                });
            }
        }
    };
}]);
