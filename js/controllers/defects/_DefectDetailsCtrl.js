dsApp.controller('_DefectDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$ionicModal',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicModal) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.project = $rootScope.projId;
        vm.settings.state = 'details';
        vm.local = {};
        vm.local.search = '';
        vm.local.entityId = $stateParams.id;

        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        vm.local.poplist = $rootScope.users;
        vm.defect = $rootScope.currentDefect;
        if ($stateParams.id === '0') {
            vm.settings.subHeader = 'New defect'
        } else {
            vm.settings.subHeader = 'Defect - ' + vm.defect.title;
        }

        //expand textarea
        var textareas = document.querySelectorAll('textarea');
        for (var i = 0; i < textareas.length; i++) {
            textareas[i].addEventListener('keydown', autosize);
        }

        function autosize() {
            var el = this;
            setTimeout(function() {
                el.style.cssText = 'height:auto; padding:0;';
                if (angular.element(el)[0].scrollHeight <= 80) {
                    el.style.cssText = 'height:' + el.scrollHeight + 'px;line-height:normal; padding-top:10px!important';
                } else {
                    el.style.cssText = 'height:' + el.scrollHeight / 2 + 'px;line-height:normal; padding-top:10px!important; margin-bottom:20px!important';
                }

            }, 0);
        }

        $ionicModal.fromTemplateUrl('templates/defects/_popover.html', {
            scope: $scope
        }).then(function(modal) {
            vm.modal = modal;
        });
        // Triggered in the login modal to close it
        vm.closePopup = function() {
            vm.modal.hide();
        };
        // Open the login modal
        vm.assignee = function() {
            vm.modal.show();
        };
        vm.addAssignee = function(item) {
            vm.defect.assignee_name = item.first_name + ' ' + item.last_name;
            vm.defect.assignee_id = item.id;
            vm.modal.hide();
        }

        vm.objtofields = function() {
            vm.defect.status_id = vm.defect.status_obj.id;
            vm.defect.status_name = vm.defect.status_obj.name;
            vm.defect.priority_id = vm.defect.priority_obj.id;
            vm.defect.priority_name = vm.defect.priority_obj.name;
            vm.defect.severity_id = vm.defect.severity_obj.id;
            vm.defect.severity_name = vm.defect.severity_obj.name;
            if (vm.defect.drawing && vm.defect.drawing.markers && vm.defect.drawing.markers.length) {
                vm.defect.drawing.markers[0].status = vm.defect.status_obj.name;
            }
        }

        vm.back = function() {
            vm.objtofields();
            $rootScope.go('app.defects', {
                id: $stateParams.id
            })
        }

        $scope.$watch('vm.defect.status_obj', function(value) { //TODO: undefined after cancel edit and enter again to details => add timeout
            var drawing = $rootScope.currentDefect.drawing;
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
            }
        })
    }
]);
