angular.module($APP.name).controller('_SubcontractorsRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'SubcontractorsService',
    '$ionicModal',
    'DefectsService',
    'SubcontractorsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, SubcontractorsService, $ionicModal, DefectsService, SubcontractorsService) {
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
        console.log($scope.settings.project);
        SubcontractorsService.list_defects($scope.settings.project.id, $scope.local.data.id).then(function(result) {
            $scope.local.list = result;
            $scope.local.loaded = true;

            DefectsService.list_small($scope.settings.project.id).then(function(defects) {
                $scope.local.poplist = [];
                for (var i = 0; i < defects.length; i++) {
                    var sw = true;
                    for (var j = 0; j < result.length; j++) {
                        if (defects[i].id === result[j].id) {
                            sw = false;
                        }
                    }
                    if (sw) {
                        $scope.local.poplist.push(defects[i]);
                    }
                }
            })

        });

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
            DefectsService.get(related.id).then(function(defect) {
                defect.assignee_id = $stateParams.id;
                DefectsService.update(defect).then(function(result) {
                    SubcontractorsService.list_defects($scope.settings.project.id, $scope.local.data.id).then(function(result) {
                        $scope.local.list = result;
                        var defects = angular.copy($scope.local.poplist)

                        $scope.local.poplist = [];
                        for (var i = 0; i < defects.length; i++) {
                            var sw = true;
                            for (var j = 0; j < result.length; j++) {
                                if (defects[i].id === result[j].id) {
                                    sw = false;
                                }
                            }
                            if (sw) {
                                $scope.local.poplist.push(defects[i]);
                            }
                        }
                        $scope.local.loaded = true;
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
