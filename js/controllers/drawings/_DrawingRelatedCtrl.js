angular.module($APP.name).controller('_DrawingRelatedCtrl', [
  '$rootScope',
  '$scope',
  '$stateParams',
  '$state',
  'SettingsService',
  '$timeout',
  'DrawingsService',
  function ($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, DrawingsService) {  //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
  $scope.settings= {};
  $scope.settings.header = SettingsService.get_settings('header');
  $scope.settings.tabActive = SettingsService.get_settings('tabActive');
  $scope.settings.project = parseInt(localStorage.getObject('dsproject'));
  localStorage.setObject('ds.defect.back', {id:$stateParams.id, state:'app.drawingrelated'})

  $scope.local={};
  $scope.local.loaded = false;
  $scope.local.data = localStorage.getObject('dsdrwact');
  $scope.settings.subHeader = 'Drawing - '+$scope.local.data.title;

  DrawingsService.list_defects($stateParams.id).then(function(result){
    $scope.local.list = result;
    $scope.local.loaded = true;
  })

  $scope.goItem = function(item){
    console.log('this is the item:',item);
    $scope.settings.subHeader = item.name;
    SettingsService.set_settings($scope.settings)
    $state.go('app.defects', {id:item})
  }

  $scope.getInitials = function (str) {
    var aux = str.split(" ");
    return (aux[0][0]+aux[1][0]).toUpperCase();
  }

  $scope.back = function () {
    $state.go('app.drawings',{id:$stateParams.id})
  }
}
]);
