angular.module($APP.name).directive('assignee', function (ProjectService, $rootScope) {
    return {
        restrict: 'E',
        link: link,
        scope: {
            'item': '=',
            'parent': '=',
            'table': '=',
            'dsb': '=',
            'subcontractors': '='
        },
        templateUrl: 'templates/_assignee.html'
    };
    function link($scope, $elem, $attrs, $ctrl) {



        $scope.filter = {};
        $scope.filter.query = '';
        $scope.filter.quantity = 3;

        $scope.toggle = function () {
            if ($scope.item.openAssignee) {
                angular.forEach($scope.parent, function (child) {
                    child.openAssignee = false;
                });
            } else {
                if ($scope.dsb) {                    
                    angular.forEach($scope.parent, function (child) {
                        child.openAssignee = false;
                    });
                    $scope.item.openAssignee = true;
                }
            }
        };

        $scope.changeAssignee = function (newAssignee) {
            $scope.item.assignee_obj = newAssignee;
            $scope.item.assignee_name = newAssignee.first_name + " " + newAssignee.last_name;
            $scope.item.openAssignee = false;
        };

        $(document).bind('click', function (event) {
            var isClickedElementChildOfPopup = $elem
                    .find(event.target)
                    .length > 0;

            if (isClickedElementChildOfPopup) {
                return;
            }

            $scope.$apply(function () {
                if ($scope.item) {
                    $scope.item.openAssignee = false;
                    $scope.filter.query = '';
                }
            });
        });

        $elem.bind('click', function (e) {
            var aux = $elem[0].querySelector('input');
            if (aux) {
                aux.focus();
            }
        });

        $scope.$watch('item', function (value) {
            if (value) {
                $scope.users = [];
                if ($scope.subcontractors) {

                }
                else {
                    ProjectService.users($rootScope.project.id).then(function (result) {
                        $scope.users = result;
                    });
                }
                angular.forEach($scope.users, function (user) {
                    if (user.id === $scope.item.assignee_id) {
                        $scope.item.assignee_obj = user;
                    }
                });
            }
        });

    }
});
