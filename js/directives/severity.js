dsApp.directive('severity', function($rootScope) {
    return {
        restrict: 'E',
        link: link,
        scope: {
          'item': '=',
          'ngDisabled': '='
        },
        templateUrl: 'templates/directives/severity.html'
    };

    function link($scope, $elem, $attrs, $ctrl) {
        $scope.local = {};
        $scope.local.active = false;
        $scope.local.txtPlaceholder = 'Select an option from the dropdown to change the severity'

        $scope.toggle = function() {
            if (!$scope.ngDisabled) {
                $scope.local.active = !$scope.local.active;
                if ($scope.local.active) {
                    $scope.local.txtActive = $scope.local.txtPlaceholder;
                } else {
                    $scope.local.txtActive = $scope.local.data.name;
                }
            }
        }

        $scope.changeSeverity = function(option) {
            $scope.local.data = option;
            $scope.item = option;
            $scope.toggle();
        }

        $(document).bind('click', function(event) {
            var isClickedElementChildOfPopup = $('#ds-severity').find(event.target).length > 0;
            if (isClickedElementChildOfPopup)
                return;
            $scope.$apply(function() {
                if ($scope.local.active) {
                    $scope.toggle();
                }
            });
        });

        $scope.$watch('item', function(value) {
            $scope.local.data = value;
            $scope.local.txtActive = value.name;
        })
    }
});
