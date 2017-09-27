dsApp.controller('LoginCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    '$ionicPopup',
    'AuthService',
    'SyncService',
    function($rootScope, $scope, $state, $ionicPopup, AuthService, SyncService) {
        $scope.user = {};
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }

        if (localStorage.getObject('dsremember')) {
            $scope.user.username = localStorage.getObject('dsremember').username;
            $scope.user.password = localStorage.getObject('dsremember').password;
            $scope.user.rememberMe = localStorage.getObject('dsremember').rememberMe;
            var loginPopup = $ionicPopup.show({
                title: "Sync",
                template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                content: "",
                buttons: []
            });
            AuthService.login($scope.user).success(function(result) {
                SyncService.syncData().then(function(res) {
                    SyncService.sync().then(function(res) {
                        localStorage.setObject('ds.user', {
                            role: result.data.role.id,
                            name: result.data.username
                        });
                        loginPopup.close();
                        $state.go('app.projects');
                    })
                });
            }).error(function(response, status) {
                if (status === 0 || status === -1) {
                    SyncService.syncData().then(function(res) { 
                        SyncService.sync().then(function(res) {
                            localStorage.setObject('ds.user', {
                                role: 0,
                                name: $scope.user.username
                            });
                            loginPopup.close();
                            $state.go('app.projects');
                        })
                    });
                }
                if (status === 502) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Offline',
                        template: "<center>Server offline</center>",
                    });
                    alertPopup.then(function(res) {});
                }
                if (status === 400) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: "<center>Incorrect user data</center>",
                    });
                    alertPopup.then(function(res) {});
                }
                if (status === 401) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: 'Your account has been de-activated. Contact your supervisor for further information',
                    });
                    alertPopup.then(function(res) {});
                }
            })
        }

        $scope.login = function() {
            var loginPopup = $ionicPopup.show({
                title: "Sync",
                template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                content: "",
                buttons: []
            });
            if ($scope.user.username && $scope.user.password) {
                AuthService.login($scope.user).success(function(result) {
                    if (result.data) {
                        SyncService.sync().then(function(res) {
                            loginPopup.close();
                            $state.go('app.projects');
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
                        loginPopup.close();
                    }
                }).error(function(response, status) {
                    if (status === 0 || status === -1) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Offline',
                            template: "<center>You are offline. Please check your internet connection and try again.</center>",
                        });
                        alertPopup.then(function(res) {});
                    }
                    if (status === 502) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Offline',
                            template: "<center>Server offline</center>",
                        });
                        alertPopup.then(function(res) {});
                    }
                    if (status === 400) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Error',
                            template: "<center>Incorrect user data</center>",
                        });
                        alertPopup.then(function(res) {});
                    }
                    if (status === 401) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Error',
                            template: 'Your account has been de-activated. Contact your supervisor for further information',
                        });
                        alertPopup.then(function(res) {});
                    }
                })
            }
        };
    }
]);
