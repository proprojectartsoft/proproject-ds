dsApp.controller('_DefectDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$indexedDB',
    '$ionicModal',
    'ProjectService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $ionicModal, ProjectService) { 
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.project = $rootScope.projId;
        $scope.settings.state = 'details';
        $scope.local = {};
        $scope.local.search = '';
        $scope.local.entityId = $stateParams.id;

        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
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

        $indexedDB.openStore('projects', function(store) {
            store.find($scope.settings.project).then(function(res) {
                $scope.local.poplist = res.users;
            })
        })

        if ($stateParams.id === '0') {
            $scope.settings.subHeader = 'New defect'
            $scope.local.data = sessionStorage.getObject('ds.defect.new.data')
        } else {
            $scope.local.data = sessionStorage.getObject('ds.defect.active.data')
            $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
        }
        $scope.objtofields = function() {
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
                sessionStorage.setObject('ds.defect.new.data', $scope.local.data)
            } else {
                if (!$rootScope.disableedit) {
                    sessionStorage.setObject('ds.defect.active.data', $scope.local.data)
                }
            }
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }

        $scope.$watch('local.data.status_obj', function(value) {

            var drawing = sessionStorage.getObject('ds.defect.drawing')
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
                sessionStorage.setObject('ds.defect.drawing', drawing)
            }
        })

    }
]);
