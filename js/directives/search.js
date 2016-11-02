angular.module($APP.name).directive('search', [
    'SearchService',
    'SweetAlert',
    '$document',
    '$state',
    function (SearchService, SweetAlert, $document, $state) {
        return {
            restrict: 'EA',
            link: link,
            templateUrl: 'templates/search.html'
        };
        function link($scope, $elem, $attrs, $ctrl) {
            $scope.filter = {};
            $scope.filter.search = '';
            $scope.filter.category = 'all'
            $scope.filter.optionsActive = false;

            $scope.toggleOptions = function () {
                $scope.filter.optionsActive = !$scope.filter.optionsActive
            }

            $scope.closeClickAnywhereButHere = function () {
                if ($scope.filter.optionsActive) {
                    $scope.filter.optionsActive = false;
                }
            }

            $scope.changeCategory = function (predicate) {
                $scope.filter.category = predicate;
                $scope.filter.optionsActive = false;
            }

            $scope.doSearch = function (event) {
                if ($scope.filter.search) {
                    if (event) {
                        if (event.keyCode === 13) {
                            $state.go('app.search', {category: $scope.filter.category, input: $scope.filter.search});
                        }
                    } else {
                        $state.go('app.search', {category: $scope.filter.category, input: $scope.filter.search});
                    }
                }
            }

        }
    }
]);

angular.module($APP.name).directive('clickAnywhereButHere', function ($document) {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            var elemClickHandler = function (e) {
                e.stopPropagation();
            };

            var docClickHandler = function () {
                scope.$apply(attr.clickAnywhereButHere);
            };

            elem.on('click', elemClickHandler);
            $document.on('click', docClickHandler);

            // teardown the event handlers when the scope is destroyed.
            scope.$on('$destroy', function () {
                elem.off('click', elemClickHandler);
                $document.off('click', docClickHandler);
            });
        }
    }
})