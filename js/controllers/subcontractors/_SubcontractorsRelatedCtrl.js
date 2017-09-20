dsApp.controller('_SubcontractorsRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    '$indexedDB',
    '$filter',
    '$ionicPopup',
    'ConvertersService',
    'ColorService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, $indexedDB, $filter, $ionicPopup, ConvertersService, ColorService) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.project = $rootScope.projId;
        $scope.settings.state = 'related';
        $scope.local = {};
        $scope.local.data = sessionStorage.getObject('dsscact');
        $scope.local.entityId = $stateParams.id;
        $scope.local.loaded = false;
        $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
        $indexedDB.openStore('projects', function(store) {
            store.find($rootScope.projId).then(function(res) {
                var subcontr = $filter('filter')(res.subcontractors, {
                    id: $scope.local.data.id
                })[0];
                $scope.local.list = subcontr.related;
                $scope.local.loaded = true;
                $scope.local.poplist = [];
                //fill the list of possible related defects
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
                //get the colors from json
                ColorService.get_colors().then(function(colorList) {
                    var colorsLength = Object.keys(colorList).length;
                    angular.forEach($scope.local.list, function(relTask) {
                        //get from defects list the current defect
                        var def = $filter('filter')(res.defects, {
                            id: relTask.id
                        })[0];
                        //assign the collor corresponding to user id and customer id
                        var colorId = (parseInt(res.customer_id + "" + def.completeInfo.assignee_id)) % colorsLength;
                        relTask.backgroundColor = colorList[colorId].backColor;
                        relTask.foregroundColor = colorList[colorId].foreColor;
                    });
                })
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
            return SettingsService.get_initials(str);
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
                store.find($scope.settings.project).then(function(project) {
                    for (var i = 0; i < project.subcontractors.length; i++) {
                        //remove the task from the list of the old subcontractor
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
                    //add the task to the list of the new subcontractor
                    subcontr.related.push(defect);
                    //get the colors from json
                    ColorService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach(subcontr.related, function(relTask) {
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(project.customer_id + "" + relTask.assignee_id)) % colorsLength;
                            relTask.backgroundColor = colorList[colorId].backColor;
                            relTask.foregroundColor = colorList[colorId].foreColor;
                        })
                    })
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
                        store.find($rootScope.projId).then(function(project) {})
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

dsApp.filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
