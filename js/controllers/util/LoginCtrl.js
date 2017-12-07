dsApp.controller('LoginCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    'AuthService',
    'SyncService',
    'SettingsService',
    '$timeout',
    function($rootScope, $scope, $state, AuthService, SyncService, SettingsService, $timeout) {
        $scope.user = {};
        //indicate if there is a defect/drawing or subcontractor added in offline mode
        $rootScope.offline = {
            defects: false,
            drawings: false,
            subcontractors: false
        }

        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }

        if (localStorage.getObject('dsremember')) {
            $scope.user.username = localStorage.getObject('dsremember').username;
            $scope.user.password = localStorage.getObject('dsremember').password;
            $scope.user.rememberMe = localStorage.getObject('dsremember').rememberMe;
            $scope.user.gmt = -(new Date().getTimezoneOffset() / 60);

            var loginPopup = SettingsService.show_loading_popup("Sync");
            AuthService.login($scope.user).success(function(result) {
                console.log('doing the log in');
                SyncService.syncData().then(function(res) {
                    SyncService.sync().then(function(res) {
                        $rootScope.offlineData = false;
                        localStorage.setObject('ds.user', {
                            role: result.data.role.id,
                            name: result.data.username
                        });
                        $timeout(function() {
                            loginPopup.close();
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
                            loginPopup.close();
                        }, 10);
                        $timeout(function() {
                            SettingsService.close_all_popups();
                            SettingsService.show_message_popup("Error", reason);
                        }, 100);
                    })
                }, function(reason) {
                    $timeout(function() {
                        loginPopup.close();
                    }, 10);
                    $timeout(function() {
                        SettingsService.close_all_popups();
                        SettingsService.show_message_popup("Error", reason);
                    }, 100);
                });
            }).error(function(response, status) {
                if (status === 0 || status === -1) {
                    SyncService.sync().then(function(res) {
                        $rootScope.offlineData = false;
                        localStorage.setObject('ds.user', {
                            role: 0,
                            name: $scope.user.username
                        });
                        $timeout(function() {
                            loginPopup.close();
                        }, 10);
                        $timeout(function() {
                            SettingsService.close_all_popups();
                            SettingsService.show_message_popup("You are offline", "You can sync your data when online");
                        }, 100);
                        $rootScope.go('app.projects');
                    }, function(reason) {
                        $timeout(function() {
                            loginPopup.close();
                        }, 10);
                        $timeout(function() {
                            SettingsService.show_message_popup("Error", reason);
                        }, 100);
                    });
                }
                if (status === 502) {
                    SettingsService.show_message_popup('Offline', "Server offline");
                }
                if (status === 400) {
                    SettingsService.show_message_popup('Error', "Incorrect user data");
                }
                if (status === 401) {
                    SettingsService.show_message_popup('Error', "Your account has been de-activated. Contact your supervisor for further information");
                }
            })
        }

        $scope.login = function() {
            var loginPopup = SettingsService.show_loading_popup("Sync");
            if ($scope.user.username && $scope.user.password) {
                $scope.user.gmt = -(new Date().getTimezoneOffset() / 60);
                AuthService.login($scope.user).success(function(result) {
                    if (result.data) {
                        SyncService.sync().then(function(res) {
                            $rootScope.offlineData = false;
                            $timeout(function() {
                                loginPopup.close();
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
                                loginPopup.close();
                            }, 10);
                            $timeout(function() {
                                SettingsService.close_all_popups();
                                SettingsService.show_message_popup("Error", reason);
                            }, 100);
                            return;
                        })
                        //store data for currently logged user
                        localStorage.setObject('ds.user', {
                            role: result.data.role.id,
                            name: result.data.username
                        });
                        //store credentials if remember me is checked
                        if ($scope.user.rememberMe) {
                            localStorage.setObject('dsremember', $scope.user);
                        } else {
                            localStorage.removeItem('dsremember');
                        }
                    } else {
                        $timeout(function() {
                            loginPopup.close();
                        }, 10);
                    }
                }).error(function(response, status) {
                    if (status === 0 || status === -1) {
                        SettingsService.show_message_popup("You are offline", "Please check your internet connection and try again.");
                    }
                    if (status === 502) {
                        SettingsService.show_message_popup('Offline', "Server offline");
                    }
                    if (status === 400) {
                        SettingsService.show_message_popup('Error', "Incorrect user data");
                    }
                    if (status === 401) {
                        SettingsService.show_message_popup('Error', "Your account has been de-activated. Contact your supervisor for further information");
                    }
                })
            }
        };
    }
]);
