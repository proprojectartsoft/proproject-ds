dsApp.controller('ProjectsCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    '$timeout',
    '$filter',
    'SyncService',

    function($rootScope, $scope, $state, $timeout, $filter, SyncService) {
        var vm = this;
        $rootScope.navTitle = 'Choose a project';
        $rootScope.currentTab = 'drawings';
        vm.projects = [];
        vm.local = {};
        vm.local.createProject = {}
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        SyncService.getProjects(function(projects) {
            vm.projects = projects;
            var aux = $rootScope.projId;
            if (aux) {
                var pr = $filter('filter')(vm.projects, {
                    id: aux
                });
                vm.local.activeProject = pr && pr.length && pr[0].value;
            }
        })
        vm.go = function(item) {
            $rootScope.projId = item.id;
            $rootScope.navTitle = item.name;
            $rootScope.customer_id = item.customer_id;
            $rootScope.drawingsLight = getLightDrawings(item);
            $rootScope.go('app.tab', {
                page: 'drawings'
            });
        }
        vm.doShow = function() {
            vm.picModal.hide();
            vm.picModal.remove();
        };

        function getLightDrawings(project) {
            var lightDrawings = [];
            angular.forEach(project.drawings, function(draw) {
                lightDrawings.push({
                    'base64String': draw.base64String,
                    'closed_out_defects': 0,
                    'code': draw.code,
                    'completed_defects': 0,
                    'contested_defects': 0,
                    'defects': null,
                    'delayed_defects': 0,
                    'drawing_date': draw.drawing_date,
                    'file_name': draw.file_name,
                    'id': draw.id,
                    'incomplete_defects': 0,
                    'markers': [],
                    'nr_of_defects': 0,
                    'partially_completed_defects': 0,
                    'project_id': draw.project_id,
                    'project_name': draw.project_name,
                    'resized_path': draw.resized_path,
                    'revision': draw.revision,
                    'title': draw.title
                })
            })
            return lightDrawings;
        }

        //create new project; NOT NEEDED YET
        // vm.showPopup = function() {
        //     $ionicPopup.show({
        //         template: '',
        //         title: 'Create project',
        //         templateUrl: 'templates/projects/_create.html',
        //         buttons: [{
        //             text: 'Cancel',
        //             onTap: function(e) {
        //                 return 'close';
        //             }
        //         }, {
        //             text: 'Create',
        //             onTap: function(e) {
        //                 if (vm.local.createProject && vm.local.createProject.project_number && vm.local.createProject.name && vm.local.createProject.addr_firstline) {
        //                     return vm.local.createProject;
        //                 } else {
        //                     return false;
        //                 }
        //             }
        //         }]
        //     }).then(function(res) {
        //         if (res == false) {
        //             $ionicPopup.show({
        //                 template: '',
        //                 title: 'Error',
        //                 template: 'Make sure you have for your new project a number, a name and address line 1.',
        //                 buttons: [{
        //                     text: 'Ok',
        //                 }]
        //             }).then(function(res) {
        //                 vm.showPopup();
        //             })
        //         } else {
        //             if (res.name) {
        //                 res.drawings = [];
        //                 res.subcontractors = [];
        //                 res.defects = [];
        //                 res.isNew = true;
        //                 if (navigator.onLine) {
        //                     //create project
        //                 } else {
        //                     $ionicPopup.show({
        //                         title: 'Offline',
        //                         template: 'You cannot create projects while offline. Please try again when online.',
        //                         buttons: [{
        //                             text: 'OK',
        //                             onTap: function(e) {
        //                                 return 'close';
        //                             }
        //                         }]
        //                     })
        //                 }
        //             } else {
        //                 delete vm.local.createProject;
        //             }
        //         }
        //     }, function(err) {}, function(msg) {});
        // };
    }
]);
