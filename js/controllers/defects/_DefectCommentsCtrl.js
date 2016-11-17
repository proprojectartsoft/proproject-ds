angular.module($APP.name).controller('_DefectCommentsCtrl', [
  '$rootScope',
  '$scope',
  '$stateParams',
  '$state',
  'SettingsService',
  '$timeout',
  'DefectsService',
  function ($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, DefectsService) {
    $scope.settings= {};
    $scope.settings.header = SettingsService.get_settings('header');
    $scope.settings.subHeader = SettingsService.get_settings('subHeader');
    $scope.settings.tabActive = SettingsService.get_settings('tabActive');

    $scope.local = {};
    $scope.local.loaded = false;
    $scope.local.data = localStorage.getObject('ds.defect.active.data');
    DefectsService.list_comments($stateParams.id).then(function(result){
      $scope.local.loaded = true;
      $scope.local.list = result
    })

    $scope.addComment = function(){
      if($scope.local.comment){
        var request = {
          "id": 0,
          "text": $scope.local.comment,
          "user_id": 0,
          "defect_id": $stateParams.id
        };
        DefectsService.create_comment(request).then(function(result){
          $scope.local.comment = '';
          DefectsService.list_comments($stateParams.id).then(function(result){
            $scope.local.list = result
          })
        })
      }
    }
    $scope.addComentAtEnter = function(event){
      if(event.keyCode === 13){
        $scope.addComment();
      }
    }

    $scope.getInitials = function (str) {
      var aux = str.split(" ");
      return (aux[0][0]+aux[1][0]).toUpperCase();
    }

    $scope.back = function () {
      $state.go('app.defects',{id: $stateParams.id})
    }
    $scope.list = ['wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut'];
  }
]);
