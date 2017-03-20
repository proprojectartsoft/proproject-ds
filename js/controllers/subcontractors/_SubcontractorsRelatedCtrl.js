angular.module($APP.name).controller('_SubcontractorsRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    '$indexedDB',
    '$filter',
    'ConvertersService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, $indexedDB, $filter, ConvertersService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        $scope.settings.state = 'related';
        $scope.local = {};
        $scope.local.data = localStorage.getObject('dsscact');
        $scope.local.entityId = $stateParams.id;
        $scope.local.loaded = false;
        $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject').id).then(function(res) {
                var subcontr = $filter('filter')(res.subcontractors, {
                    id: $scope.local.data.id
                })[0];
                $scope.local.list = subcontr.related;
                $scope.local.loaded = true;
                $scope.local.poplist = [];

                for (var i = 0; i < res.defects.length; i++) {
                    var sw = true;
                    for (var j = 0; j < subcontr.related.length; j++) {
                        if (res.defects[i].id === subcontr.related[j].id) {
                            sw = false;
                        }
                    }
                    if (sw) {
                        $scope.local.poplist.push(res.defects[i]);
                    }
                }
            })
        })

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.name;
            SettingsService.set_settings($scope.settings)
            $state.go('app.defects', {
                id: item
            })
        }
        $scope.getInitials = function(str) {
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }
        $scope.back = function() {
            $state.go('app.subcontractors', {
                id: $stateParams.id
            })
        }
        $ionicModal.fromTemplateUrl('templates/defects/_popover.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });
        // Triggered in the login modal to close it
        $scope.closePopup = function() {
            $scope.modal.hide();
        };
        // Open the login modal
        $scope.related = function() {
            $scope.modal.show();
        };

        $scope.addRelated = function(related) {
            $scope.modal.hide();
            $indexedDB.openStore('projects', function(store) {
                store.find($scope.settings.project.id).then(function(project) {
                    for (var i = 0; i < project.subcontractors.length; i++) {
                        if ($filter('filter')(project.subcontractors[i].related, {
                                id: related.id
                            }).length != 0) {
                            project.subcontractors[i].related = $filter('filter')(project.subcontractors[i].related, {
                                id: ('!' + related.id)
                            });
                            ConvertersService.decrease_nr_tasks(project.subcontractors[i], related.status_name);
                            i = project.subcontractors.length;
                        }
                    }
                    var subcontr = $filter('filter')(project.subcontractors, {
                        id: $scope.local.data.id
                    })[0];
                    var defect = $filter('filter')(project.defects, {
                        id: related.id
                    })[0];
                    defect.assignee_id = $stateParams.id;
                    var sub = $filter('filter')(project.subcontractors, {
                        id: $stateParams.id
                    })[0];
                    defect.assignee_name = sub.first_name + " " + sub.last_name;
                    defect.completeInfo.assignee_name = sub.first_name + " " + sub.last_name;
                    defect.completeInfo.assignee_id = $stateParams.id;
                    if (typeof defect.isNew == 'undefined')
                        defect.isModified = true;
                    project.isModified = true;
                    subcontr.related.push(defect);
                    ConvertersService.increase_nr_tasks(subcontr, defect.status_name);
                    saveChanges(project);
                    $scope.local.list = subcontr.related;
                    var defects = angular.copy($scope.local.poplist);
                    $scope.local.poplist = [];
                    for (var i = 0; i < defects.length; i++) {
                        var sw = true;
                        for (var j = 0; j < subcontr.length; j++) {
                            if (defects[i].id === result[j].id) {
                                sw = false;
                            }
                        }
                        if (sw) {
                            $scope.local.poplist.push(defects[i]);
                        }
                    }
                    $scope.local.loaded = true;
                })
            })
        }

        function saveChanges(project) {
            $indexedDB.openStore('projects', function(store) {
                store.upsert(project).then(
                    function(e) {
                        store.find(localStorage.getObject('dsproject').id).then(function(project) {})
                    },
                    function(e) {
                        var offlinePopup = $ionicPopup.alert({
                            title: "Unexpected error",
                            template: "<center>An unexpected error occurred while trying to add a defect</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                    })
            })
        }
    }
]);

angular.module($APP.name).filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
