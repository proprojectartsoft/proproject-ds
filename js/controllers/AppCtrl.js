angular.module($APP.name).controller('AppCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    function ($rootScope, $scope,  $state) {
       localStorage.removeItem('ds.defect.new.data');
       localStorage.removeItem('ds.defect.active.data');
       localStorage.removeItem('ds.defect.backup');
       localStorage.removeItem('dsdrwact');
    }
]);
