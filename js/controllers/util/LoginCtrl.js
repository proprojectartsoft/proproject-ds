angular.module($APP.name).controller('LoginCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  'AuthService',
  function ($rootScope, $scope, $state, AuthService) {
    $scope.user ={};

    if(localStorage.getObject('dsremember')){
      $scope.user.username = localStorage.getObject('dsremember').username;
      $scope.user.password = localStorage.getObject('dsremember').password;
      $scope.user.remember = localStorage.getObject('dsremember').remember;
    }

    $scope.login = function () {
      if($scope.user.username && $scope.user.password){
        AuthService.login($scope.user).then(function(result){
          localStorage.setObject('ds.user', {role:result.roles[1], name: result.username});
          if($scope.user.remember){
            localStorage.setObject('dsremember', $scope.user);
          }
          else{
            localStorage.removeItem('dsremember');
          }
          $state.go('app.projects');
        })
      }
    };
  }
]);
