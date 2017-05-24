angular.module($APP.name).controller('LoginCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    '$ionicPopup',
    'AuthService',
    'SyncService',
    function($rootScope, $scope, $state, $ionicPopup, AuthService, SyncService) {
        $scope.user = {};

        $scope.login = function() {
            if ($scope.user.username && $scope.user.password) {
                AuthService.login($scope.user).success(function(result) {
                    if (result.data.status) {
                        SyncService.sync();
                    } else {
                        if (result.data) {
                            SyncService.sync();
                            localStorage.setObject('ds.user', {
                                role: result.data.role.id,
                                name: result.data.username
                            });
                            if ($scope.user.remember) {
                                localStorage.setObject('dsremember', $scope.user);
                                localStorage.setItem('automLogin', true);
                            } else {
                                localStorage.removeItem('dsremember');
                                localStorage.removeItem('automLogin');
                            }
                        }
                    }
                }).error(function(response, status) {
                    if (status === 0 || status === -1) {
                        if (localStorage.getObject('automLogin'))
                            SyncService.sync();
                        else {
                            var alertPopup = $ionicPopup.alert({
                                title: 'Offline',
                                template: "<center>You are offline. Please check your internet connection and try again.</center>",
                            });
                            alertPopup.then(function(res) {});
                        }
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

        if (localStorage.getObject('dsremember')) {
            $scope.user.username = localStorage.getObject('dsremember').username;
            $scope.user.password = localStorage.getObject('dsremember').password;
            $scope.user.remember = localStorage.getObject('dsremember').remember;
            if (localStorage.getObject('automLogin'))
                $scope.login();
        }
    }
]);
