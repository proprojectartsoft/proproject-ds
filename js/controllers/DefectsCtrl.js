angular.module($APP.name).controller('DefectsCtrl', [
    '$rootScope', '$scope', 'DefectsService', '$timeout', 'SettingsService',
    function ($rootScope, $scope, DefectsService, $timeout, SettingsService) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $scope.filter = {};
        $scope.filter.statusHelp = null;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        SettingsService.init_settings();

        $timeout(function () {
            $scope.current_user = $rootScope.current_user;
        });

        $scope.toggleDefect = function (id) {
            $scope.dial = {
                id: id
            };
        };
        $scope.$on('reloadDefects', function (event, args) {
            DefectsService.list($rootScope.project.id).then(function (result) {
                $scope.defects = result;

            })
        });
        $scope.toggleChangeStatus = function (item) {
            if (item !== $scope.filter.statusHelp) {
                $scope.filter.statusHelp = item;
                
            } else {
                $scope.filter.statusHelp = null;
            }
        };

        $scope.reload = function () {
            DefectsService.list($rootScope.project.id).then(function (result) {
                $scope.defects = result;
            });
        };
        $scope.sort = {
            active: '',
            descending: undefined
        }
        $scope.changeSorting = function (column) {
            var sort = $scope.sort;
            if (sort.active == column) {
                sort.descending = !sort.descending;
            } else {
                sort.active = column;
                sort.descending = false;
            }
        };
        $scope.getIcon = function (column) {
            var sort = $scope.sort;
            if (sort.active == column) {
                return sort.descending
                        ? 'img/ic/action/arrow_up_2.png'
                        : 'img/ic/action/arrow_down_2.png';
            }

            return 'img/ic/action/arrow_down_2.png';
        }
        $timeout(function () {
            $scope.reload();
        });
        $rootScope.reloadDefects = function () {
            DefectsService.list($rootScope.project.id).then(function (result) {
                $scope.defects = result;
            });
        };
    }
]);