angular.module('synsormed.components.header',['synsormed.components.menu'])
  .directive('synsormedHeader',['$sce',function($sce){
      return {
        controller : function($scope){
          $scope.back = function(){
            window.history.back();
          }
        },
        templateUrl : 'js/components/header/header.html' ,
        restrict : 'E',
        scope : {
          title : '@',
          loggedIn: '@',
          isProvider: '@',
          backButton: '@',
          showMenu : '@',
          isEnrolled: '@'
        },
        compile: function(element, attrs){
           if (!attrs.title) { attrs.title = 'SynsorMed'; }
           attrs.title = $sce.trustAsHtml(attrs.title);

           var boolcomplie = function(val){ return String(val).toLowerCase() == 'true'; };

           if(!attrs.backButton) { attrs.backButton = true; } else { attrs.backButton = boolcomplie(attrs.backButton); }
           if(!attrs.showMenu) { attrs.showMenu = true; } else { attrs.showMenu = boolcomplie(attrs.showMenu); }
           if(!attrs.loggedIn) { attrs.loggedIn = false; } else { attrs.loggedIn = boolcomplie(attrs.loggedIn); }

           return function($scope){
               if(!attrs.isEnrolled) { attrs.isEnrolled = false; } else { attrs.isEnrolled = boolcomplie(attrs.isEnrolled); }
           };
        },
      };
  }])
