angular.module($APP.name).controller('_DefectDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    'ProjectService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, ProjectService) { //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        console.log($scope.settings.project);
        $scope.settings.state = 'details';
        $scope.local = {};
        $scope.local.search = '';
        $scope.local.entityId = $stateParams.id;

        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
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
        $scope.assignee = function() {
            $scope.modal.show();
        };
        $scope.addAssignee = function(item) {
            $scope.local.data.assignee_name = item.first_name + ' ' + item.last_name;
            $scope.local.data.assignee_id = item.id;
            $scope.modal.hide();
        }
        ProjectService.users($scope.settings.project.id).then(function(result) {
            $scope.local.poplist = result;
        })
        if ($stateParams.id === '0') {
            $scope.settings.subHeader = 'New defect'
            $scope.local.data = localStorage.getObject('ds.defect.new.data')
        } else {
            $scope.local.data = localStorage.getObject('ds.defect.active.data')
            $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
        }
        $scope.objtofields = function() {
          console.log($scope.local.data);
            $scope.local.data.status_id = $scope.local.data.status_obj.id;
            $scope.local.data.status_name = $scope.local.data.status_obj.name;
            $scope.local.data.priority_id = $scope.local.data.priority_obj.id;
            $scope.local.data.priority_name = $scope.local.data.priority_obj.name;
            $scope.local.data.severity_id = $scope.local.data.severity_obj.id;
            $scope.local.data.severity_name = $scope.local.data.severity_obj.name;
            if ($scope.local.data.drawing && $scope.local.data.drawing.markers && $scope.local.data.drawing.markers.length) {
                $scope.local.data.drawing.markers[0].status = $scope.local.data.status_obj.name;
            }
        }

        $scope.back = function() {
            $scope.objtofields();
            if ($stateParams.id === '0') {
                localStorage.setObject('ds.defect.new.data', $scope.local.data)
            } else {
                if (!$rootScope.disableedit) {
                    console.log('----', $scope.local.data);
                    localStorage.setObject('ds.defect.active.data', $scope.local.data)
                }
            }
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }

        $scope.$watch('local.data.status_obj', function(value) {

            var drawing = localStorage.getObject('ds.defect.drawing')
            if (drawing && drawing.markers && drawing.markers.length) {
                var img = '';
                switch (value.name) {
                    case 'Incomplete':
                        img = 'img/incomplete.png'
                        break;
                    case 'Completed':
                        img = 'img/completed.png'
                        break;
                    case 'Contested':
                        img = 'img/contested.png'
                        break;
                    case 'Delayed':
                        img = 'img/delayed.png'
                        break;
                    case 'Closed Out':
                        img = 'img/closed_out.png'
                        break;
                    case 'Partially Completed':
                        img = 'img/partially_completed.png'
                        break;
                }
                drawing.markers[0].status = value.name;
                drawing.markers[0].img = img;
                localStorage.setObject('ds.defect.drawing', drawing)
            }
        })

    }
]);
