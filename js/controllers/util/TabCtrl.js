angular.module($APP.name).controller('TabCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$ionicPopup',
    '$indexedDB',
    'SubcontractorsService',
    '$timeout',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, $indexedDB, SubcontractorsService, $timeout) {
        $scope.settings = {};
        $scope.settings.tabs = SettingsService.get_settings('tabs');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.local = {};
        $scope.local.inviteemail = '';
        localStorage.removeItem('ds.defect.back');

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams) {
                if (toState.name == 'app.tab') {
                    $scope.reload();
                }
            })

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
                    $timeout(function() {

                    }, 10);
                    $indexedDB.openStore('projects', function(store) {
                        store.find($scope.settings.project.id).then(function(res) {
                            $scope.list = [];
                            angular.forEach(res.drawings, function(draw) {
                                $scope.list.push({
                                    id: draw.id,
                                    name: draw.title,
                                    tasks: draw.nr_of_defects
                                })
                            });
                        })
                        $scope.settings.loaded = true;
                    })
                    break;
                case 'subcontractors':
                    $indexedDB.openStore('projects', function(store) {
                        store.find($scope.settings.project.id).then(function(res) {
                            $scope.list = [];
                            angular.forEach(res.subcontractors, function(subcontr) {
                                $scope.list.push({
                                    id: subcontr.id,
                                    name: subcontr.last_name + " " + subcontr.first_name,
                                    description: subcontr.company,
                                    icon: $scope.getInitials(subcontr.last_name + " " + subcontr.first_name),
                                    tasks: subcontr.completed_tasks + subcontr.contested_tasks + subcontr.delayed_tasks + subcontr.incomplete_tasks + subcontr.partially_completed_tasks + subcontr.closed_out_tasks
                                })
                            });
                        })
                        $scope.settings.loaded = true;
                    })
                    break;
                case 'defects':
                    console.log("get defects from indexedDB - reload");
                    $indexedDB.openStore('projects', function(store) {
                        store.find($scope.settings.project.id).then(function(res) {
                            $scope.list = [];
                            angular.forEach(res.defects, function(defect) {
                                defect.icon = $scope.getInitials(defect.assignee_name);
                                $scope.list.push(defect)
                            });
                        })
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
                    if (res !== 'close') {
                        SubcontractorsService.invite(res).then(function(result) {})
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
