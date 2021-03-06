dsApp.controller('NavCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    'PostService',
    'AuthService',
    'SyncService',
    'SettingsService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, PostService, AuthService, SyncService, SettingsService) {
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

        PostService.post({
            method: 'GET',
            url: 'user/profileds',
            data: {}
        }, function(result) {
            var aux = result.data || localStorage.getObject('ds.user')
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
            $rootScope.currentUser.username = result.data.first_name + ' ' + result.data.last_name;
        }, function(error) {
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
        })
        $scope.redirect = function(predicate) {
            $rootScope.go('app.' + predicate);
        }
        $scope.editCurrentUser = function() {
            $scope.editMode = !$scope.editMode;
        }
        $scope.logout = function() {
            if (navigator.onLine) {
                localStorage.removeItem('ds.user');
                localStorage.removeItem('dsremember');
                $rootScope.go('login');
                AuthService.logout().then(function(result) {})
            } else {
                SettingsService.show_message_popup('Error', "Can't log out now. You are offline.");
            }
        }

        $scope.goOnline = function () {
          window.open('http://proproject.io/', '_system', 'location=yes');
          return false;
        }

        $scope.sync = function() {
            if (!navigator.onLine) {
                SettingsService.show_message_popup("You are offline", "You can sync your data when online");
            } else {
                var syncPopup = SettingsService.show_loading_popup("Sync");
                $rootScope.offlineData = false;
                SyncService.syncData().then(function(res) {
                    SyncService.sync().then(function(res) {
                        $timeout(function() {
                            syncPopup.close();
                        }, 10);
                        if (res.error) {
                            $timeout(function() {
                                SettingsService.close_all_popups();
                                SettingsService.show_message_popup(res.error, res.message);
                            }, 10)
                        }
                        $rootScope.go('app.projects');
                    }, function(reason) {
                        $timeout(function() {
                            syncPopup.close();
                        }, 10);
                        $timeout(function() {
                            SettingsService.close_all_popups();
                            SettingsService.show_message_popup("Error", reason);
                        }, 100);
                    })
                }, function(reason) {
                    $timeout(function() {
                        syncPopup.close();
                    }, 10);
                    $timeout(function() {
                        SettingsService.close_all_popups();
                        SettingsService.show_message_popup("Error", reason);
                    }, 100);
                })
            }
        }
    }
]);
