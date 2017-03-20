angular.module($APP.name).controller('SubcontractorsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    '$indexedDB',
    '$filter',
    'SettingsService',
    'SubcontractorsService',
    'ConvertersService',
    function($rootScope, $scope, $stateParams, $state, $indexedDB, $filter, SettingsService, SubcontractorsService, ConvertersService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.tabActive = 'subcontractors'
        $scope.local = {};
        $scope.local.entityId = $stateParams.id;
        $rootScope.disableedit = true;
        SettingsService.put_settings('tabActive', 'subcontractors');
        localStorage.setObject('ds.defect.back', {
            id: $stateParams.id,
            state: 'app.subcontractorrelated'
        })
        localStorage.removeItem('ds.reloadevent');

        if (!localStorage.getObject('dsscact') || localStorage.getObject('dsscact').id !== parseInt($stateParams.id)) {
            $indexedDB.openStore('projects', function(store) {
                store.find(localStorage.getObject('dsproject').id).then(function(res) {
                    var subcontractor = $filter('filter')(res.subcontractors, {
                        id: $stateParams.id
                    })[0];
                    delete subcontractor.company_logo;
                    localStorage.setObject('dsscact', subcontractor)
                    $scope.local.data = subcontractor;
                    $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
                })
            })
        } else {
            $scope.local.data = localStorage.getObject('dsscact');
            $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
        }

        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
            $scope.local.backup = angular.copy($scope.local.data);
        }
        $scope.cancelEdit = function() {
            $scope.local.data = $scope.local.backup;
            $rootScope.disableedit = true;
        }
        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            $indexedDB.openStore("projects", function(store) {
                store.find(localStorage.getObject('dsproject').id).then(function(project) {
                    var subcontr = $filter('filter')(project.subcontractors, {
                        id: $scope.local.data.id
                    })[0];
                    ConvertersService.modify_subcontractor(subcontr, $scope.local.data);
                    subcontr.isModified = true;
                    project.isModified = true;
                    saveChanges(project);
                    localStorage.setObject('dsscact', $scope.local.data)
                    localStorage.setObject('ds.reloadevent', {
                        value: true
                    });
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
                            template: "<center>An unexpected error has occurred.</center>",
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
        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
        $scope.back = function() {
            $rootScope.disableedit = true;
            localStorage.removeItem('ds.defect.back');
            $state.go('app.tab')
        }
    }
]);
