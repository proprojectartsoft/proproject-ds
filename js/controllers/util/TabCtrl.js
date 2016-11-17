angular.module($APP.name).controller('TabCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$ionicPopup',
    'DefectsService',
    'DrawingsService',
    'SubcontractorsService',
    '$timeout',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, DefectsService, DrawingsService, SubcontractorsService, $timeout) {
        $scope.settings = {};
        $scope.settings.tabs = SettingsService.get_settings('tabs');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.local = {};
        $scope.local.inviteemail = '';
        localStorage.removeItem('ds.defect.back');

        $scope.$watch(function() {
            return localStorage.getItem('dsproject')
        }, function(value) {
            $scope.settings.project = localStorage.getObject('dsproject');
            if (!$scope.settings.tabActive) {
                $scope.tabSelect('drawings');
            } else {
                $scope.tabSelect($scope.settings.tabActive)
            }
        })

        $scope.$watch(function() {
            return localStorage.getItem('ds.reloadevent')
        }, function(value) {
            if (value) {
                console.log(value);
                if (!$scope.settings.tabActive) {
                    $scope.tabSelect('drawings');
                } else {
                    $scope.tabSelect($scope.settings.tabActive)
                }
            }
        })

        $scope.tabSelect = function(predicate) {
            angular.forEach($scope.settings.tabs, function(value, key) {
                $scope.settings.tabs[key] = 'img/new/' + key + '.png';
            });
            $scope.settings.tabs[predicate] = $scope.settings.tabs[predicate].substr(0, $scope.settings.tabs[predicate].lastIndexOf(".png")) + "_active" + $scope.settings.tabs[predicate].substr($scope.settings.tabs[predicate].lastIndexOf(".png"));
            $scope.settings.tabActive = predicate;
            SettingsService.set_settings($scope.settings)
            $scope.reload();
        }


        $scope.reload = function() {
            $scope.settings.loaded = false;
            $scope.list = [];
            switch ($scope.settings.tabActive) {
                case 'drawings':
                    DrawingsService.list($scope.settings.project.id).then(function(result) {
                        $scope.list = [];
                        angular.forEach(result, function(value) {
                            $scope.list.push({
                                id: value.id,
                                name: value.title,
                                tasks: value.nr_of_defects
                            })
                        });
                        $scope.settings.loaded = true;
                    })
                    break;
                case 'subcontractors':
                    SubcontractorsService.list($scope.settings.project.id).then(function(result) {
                        $scope.list = [];
                        angular.forEach(result, function(value) {
                            $scope.list.push({
                                id: value.id,
                                name: value.last_name + " " + value.first_name,
                                description: value.company,
                                icon: $scope.getInitials(value.last_name + " " + value.first_name),
                                tasks: value.completed_tasks + value.contested_tasks + value.delayed_tasks + value.incomplete_tasks + value.partially_completed_tasks + value.closed_out_tasks
                            })
                        });
                        $scope.settings.loaded = true;
                    })
                    break;
                case 'defects':
                    DefectsService.list_small($scope.settings.project.id).then(function(result) {
                        $scope.list = [];
                        angular.forEach(result, function(value) {
                            value.icon = $scope.getInitials(value.assignee_name);
                            $scope.list.push(value)
                        });
                        $scope.settings.loaded = true;
                    })
                    break;
            }
        }

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.name;
            SettingsService.set_settings($scope.settings)
            $state.go('app.' + $scope.settings.tabActive, {
                id: item.id
            })
        }
        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }

        $scope.getInitials = function(str) {
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }

        $scope.showPopup = function() {
            if ($scope.settings.tabActive === 'subcontractors') {
                $ionicPopup.show({
                    template: '',
                    title: 'Invite subcontractor',
                    scope: $scope,
                    templateUrl: 'templates/subcontractors/_create.html',
                    buttons: [{
                        text: 'Cancel',
                        onTap: function(e) {
                            return 'close';
                        }
                    }, {
                        text: 'Create',
                        onTap: function(e) {
                            if ($scope.local.inviteemail) {
                                return $scope.local.inviteemail;
                            } else {
                                e.preventDefault();
                            }
                        }
                    }]
                }).then(function(res) {
                    console.log($rootScope);
                    if (res !== 'close') {
                        console.log('Tapped!', res);
                        SubcontractorsService.invite(res).then(function(result) {
                            console.log(result);
                        })
                    }
                }, function(err) {
                    console.log('Err:', err);
                }, function(msg) {
                    console.log('message:', msg);
                });
            };
            if ($scope.settings.tabActive === 'defects') {
                $scope.go('defects', 0);
            };
        }
    }
]);
