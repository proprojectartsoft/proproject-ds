dsApp.factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    '$q',
    'PostService',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer, $q, PostService) {
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

                                PostService.post({
                                    method: 'GET',
                                    url: 'drawing/size',
                                    params: {
                                        id: drawing.id
                                    }
                                }, function(res) {
                                    if (res.data > deviceSpace - 500) {
                                        def.resolve("");
                                    } else {
                                        fileTransfer.download(
                                            uri,
                                            fileURL,
                                            function(entry) {
                                                def.resolve(fileURL);
                                            },
                                            function(error) {
                                                def.resolve("");
                                            }
                                        );
                                    }
                                }, function(error) {
                                    console.log("Error getting the size of pdf from server.");
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
                                def.resolve(cordova.file.dataDirectory + "/" + dirName);
                            }, function(error) {
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
