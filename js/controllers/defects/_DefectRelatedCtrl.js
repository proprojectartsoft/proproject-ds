angular.module($APP.name).controller('_DefectRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    '$indexedDB',
    'ColorService',
    '$filter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, $indexedDB, ColorService, $filter) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = sessionStorage.getObject('dsproject');
        $scope.settings.state = 'related';
        $scope.local = {};
        if ($stateParams.id === '0') {
            $scope.local.data = sessionStorage.getObject('ds.defect.new.data')
            $scope.settings.subHeader = 'New defect'
        } else {
            $scope.local.data = sessionStorage.getObject('ds.defect.active.data')
            $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $indexedDB.openStore('projects', function(store) {
            store.find($scope.settings.project).then(function(result) {
                $scope.local.poplist = result.defects;
                //set the background and foreground colors
                if ($scope.local.data) {
                    ColorService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach($scope.local.data.related_tasks, function(relTask) {
                            //get from defects list the current defect
                            crtDef = $filter('filter')(result.defects, {
                                id: relTask.id
                            })[0];
                            //update the assignee_name if changed
                            relTask.assignee_name = crtDef.assignee_name;
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(result.customer_id + "" + crtDef.completeInfo.assignee_id)) % colorsLength;
                            relTask.backgroundColor = colorList[colorId].backColor;
                            relTask.foregroundColor = colorList[colorId].foreColor;
                        })
                    })
                }
            })
        })

        $scope.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }

        $scope.getInitials = function(str) {
            if (str) {
                var aux = str.split(" ");
                return (aux[0][0] + aux[1][0]).toUpperCase();
            }
            return "";
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
        $scope.addRelated = function(item) {
            $scope.local.data.related_tasks.push(item);
            if ($stateParams.id === '0') {
                sessionStorage.setObject('ds.defect.new.data', $scope.local.data);
            } else {
                sessionStorage.setObject('ds.defect.active.data', $scope.local.data);
            }
            $indexedDB.openStore('projects', function(store) {
                store.find($scope.settings.project).then(function(result) {
                    ColorService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach($scope.local.data.related_tasks, function(relTask) {
                            //get from defects list the current defect
                            var def = $filter('filter')(result.defects, {
                                id: relTask.id
                            })[0];
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(result.customer_id + "" + def.completeInfo.assignee_id)) % colorsLength;
                            relTask.backgroundColor = colorList[colorId].backColor;
                            relTask.foregroundColor = colorList[colorId].foreColor;
                        })
                    })
                })
            })
            $scope.modal.hide();
        }

    }
]);
