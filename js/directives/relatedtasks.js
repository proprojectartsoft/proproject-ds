angular.module($APP.name).directive('relatedtasks', function (DefectsService, $rootScope, $filter, $timeout) {
    return {
        restrict: 'E',
        link: link,
        scope: {
            'item': '=',
            'disabled': '='
        },
        templateUrl: 'templates/_related_tasks.html'
    };
    function link($scope, $elem, $attrs, $ctrl) {
        DefectsService.list_small($rootScope.project.id).then(function (result) {
            $scope.defects = result;
            $scope.defectsBackup = result;
        });
        $scope.filter = {};
        $scope.filter.query = '';
        $scope.filter.disabled = false;
//        $scope.filter.quantity = 5;

        $scope.addOnEnter = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                if ($scope.defects[0]) {
                    $scope.addRelated($scope.defects[0]);
                }
            } else {
                if (event.keyCode === 9) {
                    $scope.item.openRelated = false;
                }
            }
        };
        $scope.addRelated = function (related) {
            if (!$scope.item.related_tasks) {
                $scope.item.related_tasks = [];
            }
            if ($scope.item.related_tasks.indexOf(related) === -1) {
                $scope.item.related_tasks.push(related);
                $scope.filter.query = "";
                $scope.item.openRelated = false;
            }

        };
        $scope.removeRelated = function (related) {
            $scope.indexRelated = $scope.item.related_tasks.indexOf(related);
            $scope.item.related_tasks.splice($scope.indexRelated, 1);
        };

        $scope.focused = function () {
            $scope.item.openRelated = true;
        };

        $scope.$watch("filter.query", function (newValue, oldValue) {
            if (newValue === "") {
                $scope.defects = $scope.defectsBackup;
            } else {
                $scope.defects = $filter('filter')($scope.defectsBackup, {title: $scope.filter.query});
            }
        });
        $scope.$watch("disabled", function (newValue, oldValue) {
        });
        $(document).bind('click', function (event) {
            var isClickedElementChildOfPopup = $elem
                    .find(event.target)
                    .length > 0;

            if (isClickedElementChildOfPopup) {
                return;
            }

            $scope.$apply(function () {
                if ($scope.item) {
                    $scope.item.openRelated = false;
                    $scope.filter.query = '';
                }
            });
        });

         $scope.$watch('item', function (value) {
            if (value) {                
                if ($scope.item.id) {
                    DefectsService.related_tasks_update($rootScope.project.id,$scope.item.id).then(function (result) {
                        $scope.defects = result;
                        $scope.defectsBackup = result;
                    });
                } else {
                    DefectsService.related_tasks_new($rootScope.project.id).then(function (result) {
                        $scope.defects = result;
                        $scope.defectsBackup = result;
                    });
                }
            }
        });
        $scope.$watch('disabled', function (value) {
            $scope.filter.disabled = value;
        });

    }
});