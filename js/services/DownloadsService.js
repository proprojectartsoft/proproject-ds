angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    '$q',
    'DrawingsService',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer, $q, DrawingsService) {
        return {
            downloadPdf: function(drawing, dir) {
                var def = $q.defer();
                return $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        document.addEventListener(
                            "deviceready",
                            function() {
                                var fileTransfer = new FileTransfer();
                                var uri = encodeURI($APP.server + '/pub/drawings/' + drawing.base64String);
                                var fileURL = dir + "/" + drawing.base64String;
                                var deviceSpace = 0;

                                cordova.exec(
                                    function(freeSpace) {
                                        deviceSpace = freeSpace;
                                    },
                                    function() {},
                                    "File", "getFreeDiskSpace", []);

                                DrawingsService.get_pdf_size(drawing.id).then(function(res) {
                                    if (res > deviceSpace - 500) {
                                        def.resolve("");
                                        return;
                                    }
                                    fileTransfer.download(
                                        uri,
                                        fileURL,
                                        function(entry) {
                                            console.log("download complete: " + entry.toURL());
                                            def.resolve(fileURL);
                                        },
                                        function(error) {
                                            def.resolve("");
                                        }
                                    );
                                })
                            },
                            false);
                    }
                }).then(function(success) {
                    return def.promise;
                })
            },

            createDirectory: function(dirName) {
                var def = $q.defer();
                return $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        if (typeof cordova == 'undefined') {
                            cordova = {};
                            cordova.file = {
                                dataDirectory: '///'
                            }
                        }

                        $cordovaFile.createDir(cordova.file.dataDirectory, dirName, true)
                            .then(function(success) {
                                console.log('dir created:');
                                def.resolve(cordova.file.dataDirectory + "/" + dirName);
                            }, function(error) {
                                console.log(error);
                                def.resolve('fail');
                            });
                    }
                }).then(function(success) {
                    return def.promise;
                })
            }
        }
    }
]);
