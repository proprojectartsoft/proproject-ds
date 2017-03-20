angular.module($APP.name).controller('LoginCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    'AuthService',
    'SyncService',
    function($rootScope, $scope, $state, AuthService, SyncService) {
        $scope.user = {};

        $scope.login = function() {
            if ($scope.user.username && $scope.user.password) {
                AuthService.login($scope.user).then(function(result) {
                    if (result.status) {
                        SyncService.sync();
                    } else {
                        if (result) {
                            SyncService.sync();
                            localStorage.setObject('ds.user', {
                                role: result.role.id,
                                name: result.username
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
