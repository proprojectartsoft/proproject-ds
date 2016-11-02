angular.module($APP.name).controller('NavCtrl', [
  '$rootScope',
  '$state',
  '$scope',
  '$ionicSideMenuDelegate',
  '$timeout',
  '$http',
  'SettingsService',
  'AuthService',
  function ($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $http, SettingsService, AuthService) {
    $scope.disconnectDesignValue = true;
    $scope.settings = {};
    $scope.settings.header = SettingsService.get_settings('header');
    $scope.editMode = false;
    $scope.toggleLeft = function ($event) {
      $ionicSideMenuDelegate.toggleLeft();

    };
    SettingsService.my_account().then(function(result){
      $rootScope.currentUser = result;
    })
    $scope.test = function () {
      console.log('asdasd')
    }
    $scope.redirect = function (predicate) {
      $state.go('app.' + predicate);
      console.log(predicate);
    }
    $scope.editCurrentUser = function () {
            $scope.editMode = !$scope.editMode;
            console.log('tiganii')
        }
    $scope.logout = function(){
      AuthService.logout().then(function(result){
        $state.go('login');
      })
    }
    $scope.$watch(function () { return localStorage.getObject('dsnavTitle')},function(value){
      $scope.settings.header = value;
    })
  }
]);
