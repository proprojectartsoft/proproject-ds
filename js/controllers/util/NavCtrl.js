angular.module($APP.name).controller('NavCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    '$http',
    '$indexedDB',
    'SettingsService',
    'AuthService',
    'SyncService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $http, $indexedDB, SettingsService, AuthService, SyncService) {
        $scope.disconnectDesignValue = true;
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.editMode = false;
        $scope.toggleLeft = function($event) {
            $ionicSideMenuDelegate.toggleLeft();

        };
        SettingsService.my_account().then(function(result) {
            var aux = localStorage.getObject('ds.user')
            switch (aux.role) {
                case '1':
                    aux.role_title = 'Site Manager'
                    break;
                case '2':
                    aux.role_title = 'Company Admin'
                    break;
                case '3':
                    aux.role_title = 'Super Admin'
                    break;
            }
            $rootScope.currentUser = aux;
            $rootScope.currentUser.username = result.first_name + ' ' + result.last_name;
        })
        $scope.redirect = function(predicate) {
            $state.go('app.' + predicate);
        }
        $scope.editCurrentUser = function() {
            $scope.editMode = !$scope.editMode;
        }
        $scope.logout = function() {
            AuthService.logout().then(function(result) {
                $indexedDB.openStore('projects', function(store) {
                    store.clear();
                }).then(function(e) {})
                $state.go('login');
            })
        }
        $scope.sync = function() {
            SyncService.sync();
        }
        $scope.$watch(function() {
            return localStorage.getObject('dsnavTitle')
        }, function(value) {
            $scope.settings.header = value;
        })
    }
]);
