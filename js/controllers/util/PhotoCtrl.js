dsApp.controller('PhotoCtrl', [
    '$rootScope',
    '$state',
    function($rootScope, $state) {
        var vm = this;
        vm.settings = {};
        if ($rootScope.currentDefect.id === '0') {
            vm.settings.subHeader = 'New defect'
        } else {
            vm.settings.subHeader = 'Defect - ' + $rootScope.currentDefect.title;
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        vm.local = {};
        vm.local.data = $rootScope.currentPhoto;
        vm.local.data.url_original = $APP.server + 'pub/defectPhotos/' + vm.local.data.base_64_string.replace("resized", "original");
        vm.back = function() {
            //TODO: save changes
            $state.go('app.defectattachments', {
                id: $rootScope.currentDefect.id
            })
        }
    }
]);
