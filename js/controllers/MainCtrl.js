angular.module($APP.name).controller('MainCtrl', [
    '$rootScope', '$scope', 'AuthService', '$state', 'ProjectService', 'createDialog', 'CacheFactory',
    function ($rootScope, $scope, AuthService, $state, ProjectService, createDialog, CacheFactory) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;

        var settingsDSC = CacheFactory.get('settingsDSC');
        if (!settingsDSC) {
            settingsDSC = CacheFactory('settingsDSC');
            settingsDSC.setOptions({
                storageMode: 'localStorage'
            });
        }

        ProjectService.list().then(function (result) {
            $rootScope.projects = result;
            $rootScope.project = settingsDSC.get('project');
            if (!$rootScope.project) {
                $rootScope.project = $rootScope.projects[0];
            }
        });

        $scope.toggleMenu = function () {
            $rootScope.activeMenu = !$rootScope.activeMenu;
        };
        $scope.toggleProjects = function () {
            $rootScope.activeMenu = true;
            $rootScope.activeProjects = !$rootScope.activeProjects;
            
        };

        $scope.selectProject = function (project) {
            settingsDSC.put('project', project);
            $rootScope.project = project;
            $state.go('app.defects');
            if($rootScope.reloadDefects){
                $rootScope.reloadDefects();
            }
            $rootScope.activeMenu = !$rootScope.activeMenu;
        };
        $scope.logout = function () {
            AuthService.logout().then(function (result) {
                $state.go("login");
            });
        };
        $scope.createProject = function () {
            $rootScope.createProject = false;
            createDialog('templates/_create_project.html', {
                id: 'complexDialog',
                backdrop: true,
                controller: '_createProjectCtrl',
                modalClass: 'modal de-drawings-edit',
                success: {label: 'Success', fn: function () {
                    }}
            }, {
                title: 'Create new project'
            });
        }
    }
]);