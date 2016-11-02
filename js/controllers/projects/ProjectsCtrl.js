angular.module($APP.name).controller('ProjectsCtrl', [
  '$rootScope',
  '$state',
  '$scope',
  '$ionicSideMenuDelegate',
  '$timeout',
  '$ionicPopup',
  '$ionicModal',
  'ProjectService',
  function ($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicModal, ProjectService) {
    $rootScope.navTitle = 'Projects';
    $scope.project = {};

    ProjectService.list().then(function(result){
      $rootScope.projects = result;
    })

    $scope.go =function(item){
      localStorage.setObject('dsproject',item.id);
      localStorage.setObject('dsnavTitle',item.name);
        $state.go('app.tab', {page:'drawings'});
      
    }
    $scope.doShow = function () {
      $scope.picModal.hide();
      $scope.picModal.remove();
    };

    $scope.showPopup = function () {
      $ionicPopup.show({
        template: '',
        title: 'Create project',
        scope: $scope,
        templateUrl: 'templates/projects/_create.html',
        buttons: [
          {
            text: 'Cancel',
            onTap: function (e) {
              return 'awesome';
            }
          },
          {
            text: 'Create',
            onTap: function (e) {
              return $scope.project;
            }
          }
        ]
      }).then(function (res) {
        console.log('Tapped!', res);
      }, function (err) {
        console.log('Err:', err);
      }, function (msg) {
        console.log('message:', msg);
      });
    };


  }
]);
