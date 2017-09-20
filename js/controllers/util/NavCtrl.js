dsApp.controller('NavCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    '$http',
    '$indexedDB',
    '$ionicPopup',
    'SettingsService',
    'AuthService',
    'SyncService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $http, $indexedDB, $ionicPopup, SettingsService, AuthService, SyncService) {
        $scope.disconnectDesignValue = true;
        $scope.settings = {};
        $scope.editMode = false;
        $rootScope.navTitle = "";
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.toggleLeft = function($event) {
            $ionicSideMenuDelegate.toggleLeft();
        };
        SettingsService.my_account().then(function(result) {
            var aux = localStorage.getObject('ds.user')
            switch (aux.role) {
                case 1:
                    aux.role_title = 'Site Manager'
                    break;
                case 2:
                    aux.role_title = 'Company Admin'
                    break;
                case 3:
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
            if (navigator.onLine) {
                localStorage.removeItem('ds.user');
                localStorage.removeItem('dsremember');
                $indexedDB.openStore('projects', function(store) {
                    store.clear();
                })
                $state.go('login');
                AuthService.logout().then(function(result) {})
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: "<center>Can't log out now. You are offline.</center>",
                });
            }
        }
        $scope.sync = function() {
            SyncService.sync().then(function(res) {
                //TODO: check if error or sync_done and go to corresponding page
                $state.go('app.projects');
            })
        }
    }
]);
