angular.module($APP.name).controller('_AddDrawingCtrl', [
    '$rootScope', '$scope', 'DrawingsService', 'fileUpload','SweetAlert',
    function ($rootScope, $scope, DrawingsService, fileUpload,SweetAlert) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $scope.filter = {};
        $scope.filter.hasImg = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.filter.managercontainer = {};
        $scope.filter.drawing = {
            id: 0,
            project_id: $rootScope.project.id,
            title: '',
            file_name: '',
            code: '',
            revision: '',
            drawing_date: 0,
            date_obj: new Date(),
            base64String: '',
            markers: [],
            incomplete_defects: 0,
            delayed_defects: 0,
            contested_defects: 0,
            partially_completed_defects: 0,
            completed_defects: 0,
            closed_out_defects: 0
        };
        $scope.open1 = function () {
            $scope.popup1.opened = true;    
            
        };
        
        $scope.popup1 = {
            opened: false
        };
        $rootScope.$watch('myFile', function (val) {
            $scope.auxFile = val;
        })
        
        $scope.save = function () {
            var aux = angular.copy($scope.filter.drawing);
            if (aux.date_obj) {
                aux.drawing_date = aux.date_obj.getTime();
            }
            if($scope.filter.drawing.title && $scope.filter.drawing.code && $scope.auxFile){
                DrawingsService.upload(aux, $rootScope.myFile).then(function (result) {
                   SweetAlert.swal({
                    title: "Success",
                    text: "Drawing added",
                    type: "success",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true}
                ); 
                $rootScope.$broadcast('reloadDrawings');
                $scope.$modalCancel();
            });
                
            } else {
                 SweetAlert.swal({
                    title: "Error",
                    text: "Please enter required fields",
                    type: "error",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true});
            }
            
        };
        $rootScope.myFile = {};
    }
        
        
]);