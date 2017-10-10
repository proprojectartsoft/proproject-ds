dsApp.controller('AppCtrl', [
    '$rootScope',
    '$timeout',
    '$scope',
    '$state',
    '$stateParams',
    '$ionicSideMenuDelegate',
    '$ionicHistory',
    '$window',
    function($rootScope, $timeout, $scope, $state, $stateParams, $ionicSideMenuDelegate, $ionicHistory, $window) {
        /**
         * Method to go somewhere
         * @param {String} where - app state to go to
         * @param {Object} [params] - object with params to send
         * @param {Boolean} [reload] - boolean to force reload of the page
         */
        $rootScope.go = function(where, params, reload) {
            //if ($ionicSideMenuDelegate.isOpen()) $ionicSideMenuDelegate.toggleLeft();
            $ionicHistory.clearCache().then(function() {

                // this would be the forced reload of a profile page
                if (where === 'reload') {
                    return $state.reload();
                }

                if (!reload) reload = false;
                if (!params) params = $stateParams;

                if (where === $state.current.name) {
                    return $window.location.reload();
                }

                var reloadParam = {
                    reload: reload
                };

                if (reload) {
                    reloadParam.location = 'replace';
                    reloadParam.inherit = false;
                    reloadParam.notify = true;
                }

                $state.go(where, params, reloadParam);
            });
        };

    }
]);
