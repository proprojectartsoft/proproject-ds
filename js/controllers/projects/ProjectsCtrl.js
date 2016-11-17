angular.module($APP.name).controller('ProjectsCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    '$ionicPopup',
    '$ionicModal',
    'ProjectService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicModal, ProjectService) {
        $rootScope.navTitle = 'Projects';
        localStorage.setObject('dsnavTitle', 'Choose a project');
        $scope.local = {};
        $scope.local.createProject = {}
        $scope.local.user = localStorage.getObject('ds.user')

        ProjectService.list().then(function(result) {
            $rootScope.projects = result;
            var aux = localStorage.getObject('dsproject')
            if (aux) {
                angular.forEach(result, function(value, key) {
                    if (value.id == aux.id){
                      $scope.local.activeProject = value;
                    }
                });
            }
        })


        $scope.go = function(item) {
            localStorage.setObject('dsproject', item);
            localStorage.setObject('dsnavTitle', item.name);
            $state.go('app.tab', {
                page: 'drawings'
            });

        }
        $scope.doShow = function() {
            $scope.picModal.hide();
            $scope.picModal.remove();
        };

        $scope.showPopup = function() {
            $ionicPopup.show({
                template: '',
                title: 'Create project',
                scope: $scope,
                templateUrl: 'templates/projects/_create.html',
                buttons: [{
                    text: 'Cancel',
                    onTap: function(e) {
                        return 'close';
                    }
                }, {
                    text: 'Create',
                    onTap: function(e) {
                        if ($scope.local.createProject.project_number && $scope.local.createProject.name && $scope.local.createProject.addr_firstline) {
                            return $scope.local.createProject;
                        } else {
                            e.preventDefault();
                        }
                    }
                }]
            }).then(function(res) {
                if (res.name) {
                    ProjectService.create(res).then(function(result) {
                        delete $scope.local.createProject;
                    })
                } else {
                    delete $scope.local.createProject;
                }
            }, function(err) {}, function(msg) {});
        };


    }
]);
