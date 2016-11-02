/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

angular.module($APP.name).controller('SearchResultsCtrl', [
    '$scope',
    'SearchService',
    'SweetAlert',
    '$rootScope',
    '$stateParams',
    '$state',
    function ($scope, SearchService, SweetAlert, $rootScope, $stateParams, $state) {
        $rootScope.paginationRoot = [
            {
                name: 'Home',
                link: 'app.completed'
            },
            {
                name: 'Search results'
            }
        ];

        $scope.filter = {};
        delete $scope.dataSearch;

        if ($stateParams.category !== 'all') {
            $scope.filter.category = $stateParams.category;
            $scope.filter.categoryState = $stateParams.category;
            $scope.filter.input = $stateParams.input;
            SearchService.get($stateParams.category, $stateParams.input).then(function (result) {
                $scope.dataSearch = result;
            });
        } else {
            $scope.filter.category = 'all';
            $scope.filter.categoryState = 'all';
            $scope.filter.input = $stateParams.input;
            SearchService.get(null, $stateParams.input).then(function (result) {
                $scope.dataSearch = result;
                if (result.form_designs.length !== 0) {
                    $scope.filter.category = 'design'
                } else {
                    if (result.form_instances.length !== 0) {
                        $scope.filter.category = 'instance'
                    } else {
                        if (result.registers.length !== 0) {
                            $scope.filter.category = 'register'
                        }
                    }
                }
            });
        }

        $scope.tooglePreview = function (predicate, id, state) {
            $scope.dial = {
                'predicate': predicate,
                'id': id,
                'state': state
            };
        };

        $scope.toggle = function (predicate) {
            if ($scope.filter.category === predicate) {
                $scope.filter.category = 'all'
            } else {
                $scope.filter.category = predicate;
            }
        }
    }
]);
