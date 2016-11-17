angular.module($APP.name).controller('_DefectRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    'DefectsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, DefectsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        $scope.settings.state = 'related';

        $scope.local = {};
        if ($stateParams.id === '0') {
            $scope.local.data = localStorage.getObject('ds.defect.new.data')
            $scope.settings.subHeader = 'New defect'
        } else {
            $scope.local.data = localStorage.getObject('ds.defect.active.data')
            $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
        }

        $scope.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }

        $scope.getInitials = function(str) {
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }


        DefectsService.list_small($scope.settings.project.id).then(function(result) {
            $scope.local.poplist = result;
        })

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
        $scope.addRelated = function(item) {
            $scope.local.data.related_tasks.push(item);
            if ($stateParams.id === '0') {
                localStorage.setObject('ds.defect.new.data', $scope.local.data);
            } else {
                localStorage.setObject('ds.defect.active.data', $scope.local.data);
            }
            $scope.modal.hide();
        }

    }
]);
