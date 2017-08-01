angular.module($APP.name).controller('ProjectsCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    '$ionicPopup',
    '$ionicModal',
    '$indexedDB',
    '$filter',
    'ProjectService',
    'SubcontractorsService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicModal, $indexedDB, $filter, ProjectService, SubcontractorsService) {
        $rootScope.navTitle = 'Projects';
        $rootScope.projects = [];
        localStorage.setObject('dsnavTitle', 'Choose a project');
        $scope.local = {};
        $scope.local.createProject = {}
        $scope.local.user = localStorage.getObject('ds.user')

        $indexedDB.openStore('projects', function(store) {
            store.getAll().then(function(res) {
                angular.forEach(res, function(proj) {
                    $rootScope.projects.push(proj);
                })
                var aux = localStorage.getObject('dsproject')
                if (aux) {
                    $scope.local.activeProject = $filter('filter')($rootScope.projects, {
                        id: aux.id
                    })[0];
                }
            })
        })
        $scope.go = function(item) {
            localStorage.setObject('dsproject', item);
            localStorage.setObject('dsnavTitle', item.name);
            $state.go('app.tab', {
                page: 'drawings'
            });
        }
        $scope.doShow = function() {
            $scope.picModal.hide();
            $scope.picModal.remove();
        };
        $scope.showPopup = function() {
            $ionicPopup.show({
                template: '',
                title: 'Create project',
                scope: $scope,
                templateUrl: 'templates/projects/_create.html',
                buttons: [{
                    text: 'Cancel',
                    onTap: function(e) {
                        return 'close';
                    }
                }, {
                    text: 'Create',
                    onTap: function(e) {
                        if ($scope.local.createProject && $scope.local.createProject.project_number && $scope.local.createProject.name && $scope.local.createProject.addr_firstline) {
                            return $scope.local.createProject;
                        } else {
                            return false;
                        }
                    }
                }]
            }).then(function(res) {
                if (res == false) {
                    $ionicPopup.show({
                        template: '',
                        title: 'Error',
                        scope: $scope,
                        template: 'Make sure you have for your new project a number, a name and address line 1.',
                        buttons: [{
                            text: 'Ok',
                        }]
                    }).then(function(res) {
                        $scope.showPopup();
                    })
                } else {
                    if (res.name) {
                        res.drawings = [];
                        res.subcontractors = [];
                        res.defects = [];
                        res.isNew = true;
                        if (navigator.onLine) {
                            ProjectService.create(res).then(function(result) {
                                delete $scope.local.createProject;
                                //copy the previously created project into local DB
                                ProjectService.list().then(function(projects) {
                                    var proj = $filter('filter')(projects, {
                                        id: result
                                    })[0];
                                    proj.light_drawings = [];
                                    proj.defects = [];
                                    ProjectService.users(result).then(function(usr) {
                                        proj.users = usr;
                                        SubcontractorsService.list(result).then(function(subcontractors) {
                                            proj.subcontractors = subcontractors;
                                            if (proj.subcontractors.length == 0) {
                                                $indexedDB.openStore('projects', function(store) {
                                                    store.insert(proj).then(function(e) {});
                                                    $rootScope.projects.push(proj);
                                                })
                                            }
                                            angular.forEach(proj.subcontractors, function(subcontr) {
                                                SubcontractorsService.list_defects(result, subcontr.id).then(function(rel) {
                                                    subcontr.related = rel;
                                                    if (proj.subcontractors[proj.subcontractors.length - 1] === subcontr) {
                                                        $indexedDB.openStore('projects', function(store) {
                                                            store.insert(proj).then(function(e) {});
                                                            $rootScope.projects.push(proj);
                                                        })
                                                    }
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        } else {
                            $ionicPopup.show({
                                title: 'Offline',
                                scope: $scope,
                                template: 'You cannot create projects while offline. Please try again when online.',
                                buttons: [{
                                    text: 'OK',
                                    onTap: function(e) {
                                        return 'close';
                                    }
                                }]
                            })
                        }
                    } else {
                        delete $scope.local.createProject;
                    }
                }
            }, function(err) {}, function(msg) {});
        };
    }
]);
