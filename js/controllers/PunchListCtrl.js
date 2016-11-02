angular.module($APP.name).controller('PunchListCtrl', [
    '$rootScope', '$scope', 'DefectsService', 'SettingsService', '$timeout',
    function ($rootScope, $scope, DefectsService, SettingsService, $timeout) {
        $('body').css('cursor','auto')
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        SettingsService.init_settings();
        $scope.filter = {};
        $scope.filter.server = $APP.server;
        $scope.reload = function () {
            DefectsService.list_punchlist($rootScope.project.id).then(function (result) {
                $scope.models = {
                    lists: {"incomplete": result.incompleteDefects, "contested": result.contestedDefects, "delayed": result.delayedDefects, "partially completed": result.partiallyCompletedDefects, "completed": result.completedDefects, "closed out": result.closedOutDefects}
                };
            });
        };
        $scope.generate = function () {
            DefectsService.reports($rootScope.project.id).then(function (result) {
                $rootScope.report = result;
            });
        };
        $scope.generateAnalytical = function () {
            DefectsService.analytical($rootScope.project.id).then(function (result) {
                $rootScope.analyticalreport = result;

            });
        };
        $scope.downloadThis = function (predicate) {
            $scope.aux = $APP.server + 'api/pdf_controller/downloadDsReport?projectId=' + $rootScope.project.id;
        };
        $scope.downloadAnalytical = function (predicate) {
            $scope.aux = $APP.server + 'api/pdf_controller/downloadAnalyticalDsReport?projectId=' + $rootScope.project.id;
        };
        $timeout(function () {
            $scope.current_user = $rootScope.current_user;

        });
        $scope.$on('$viewContentLoaded', function () {
            var aux = $('#incomplete');
        });

        $scope.toggleNewTask = function (id) {
            $scope.dial = {
                id: id
            };
        };
        $scope.test = function () {
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
                        ? 'img/ic/action/arrow_up.png'
                        : 'img/ic/action/arrow_down.png';
            }

            return 'img/ic/action/sorting_white.png';
        }
        $timeout(function () {
            $scope.reload();
        });
        $scope.myCallback = function (event, index, item, external, type, allowedType) {
            $timeout(function () {
                for (var i = 0; i < event.path.length; i++) {
                    if (event.path[i].id) {
                        var aux = angular.copy(item)
                        var aux2 = $scope.getStatusObj(event.path[i].id)
                        aux.status_id = aux2.id;
                        aux.status_name = aux2.name;
                        DefectsService.update(aux).then(function (result) {
                        })
                    }

                }
            })

            return item;
        }

        $scope.getStatusObj = function (predicate) {
            if (predicate === 'incomplete') {
                return {id: 0, name: 'Incomplete'};
            }
            if (predicate === 'contested') {
                return {id: 1, name: 'contested'}
            }
            if (predicate === 'delayed') {
                return {id: 2, name: 'Delayed'}
            }
            if (predicate === 'partially completed') {
                return {id: 3, name: 'Partially Completed'}
            }
            if (predicate === 'completed') {
                return {id: 4, name: 'Completed'}
            }
            if (predicate === 'closed out') {
                return {id: 5, name: 'Closed Out'};
            }
        }
    }

]);