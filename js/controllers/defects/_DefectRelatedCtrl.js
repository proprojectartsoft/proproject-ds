dsApp.controller('_DefectRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.project = $rootScope.projId;
        vm.settings.state = 'related';
        vm.local = {};
        vm.defect = $rootScope.currentDefect;
        if ($stateParams.id === '0') {
            vm.settings.subHeader = 'New defect'
        } else {
            vm.settings.subHeader = 'Defect - ' + vm.defect.title;
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }

        vm.local.poplist = $rootScope.defects;
        //set the background and foreground colors
        if (vm.defect) {
            SettingsService.get_colors().then(function(colorList) {
                var colorsLength = Object.keys(colorList).length;
                angular.forEach(vm.defect.related_tasks, function(relTask) {
                    //assign the collor corresponding to user id and customer id
                    var colorId = (parseInt($rootScope.customer_id + "" + relTask.assignee_id)) % colorsLength;
                    relTask.backgroundColor = colorList[colorId].backColor;
                    relTask.foregroundColor = colorList[colorId].foreColor;
                })
            })
        }

        vm.back = function() {
            $rootScope.go('app.defects', {
                id: $stateParams.id
            })
        }

        vm.getInitials = function(str) {
            return SettingsService.get_initials(str);
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
        vm.related = function() {
            vm.modal.show();
        };

        vm.addRelated = function(item) {
            vm.defect.related_tasks.push(item);
            vm.modal.hide();
        }

    }
]);
