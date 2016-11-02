angular.module($APP.name).controller('AppCtrl', [
    '$rootScope', '$scope', 'AuthService', '$state', 'ProjectService', 'CacheFactory', 'SettingsService',
    function ($rootScope, $scope, AuthService, $state, ProjectService, CacheFactory, SettingsService) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        SettingsService.init_settings();
        $rootScope.global = {
            search: ''
        };
        $scope.filter = {};
        $scope.filter.searchText = '';
        $scope.hoverIn = function () {
            this.hoverEdit = true;
        };
        $scope.toggleSearch = function () {
            $rootScope.activeSearch = !$rootScope.activeSearch;
        };
        $scope.toggleNotification = function () {
            $rootScope.activeNotification = !$rootScope.activeNotification;
        };
        SettingsService.notification_count().then(function (result) {
            $rootScope.notificationCount = result;
        });
        SettingsService.notification().then(function (result) {
            $rootScope.notifications = result;
        });
        $scope.hoverOut = function () {
            this.hoverEdit = false;
        };
        $scope.$on('scanner-started', function (event, args) {

            ProjectService.list().then(function (result) {
                $rootScope.projects = result;
                $rootScope.project = settingsDSC.get('project');
                if (!$rootScope.project) {
                    $rootScope.project = $rootScope.projects[0];
                }
            });
        });
    }
]);