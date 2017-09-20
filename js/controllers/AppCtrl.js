dsApp.controller('AppCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    function ($rootScope, $scope,  $state) {
       sessionStorage.removeItem('ds.defect.new.data');
       sessionStorage.removeItem('ds.defect.active.data');
       sessionStorage.removeItem('ds.defect.drawing');
       sessionStorage.removeItem('ds.fullscreen.back');
       sessionStorage.removeItem('dsdrwact');
    }
]);
