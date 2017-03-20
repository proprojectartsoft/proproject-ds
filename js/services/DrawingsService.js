angular.module($APP.name).factory('DrawingsService', [
    '$http',
    '$rootScope',
    function($http, $rootScope) {
        return {
            list: function(projectId) {
                return $http.get($APP.server + 'api/drawing/list', {
                    params: {
                        projectId: projectId
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            list_light: function(projectId) {
                return $http.get($APP.server + 'api/drawing/light', {
                    params: {
                        projectId: projectId
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            list_small: function(projectId) {
                return $http.get($APP.server + 'api/defect/small', {
                    params: {
                        projectId: projectId
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            get: function(id) {
                return $http.get($APP.server + '/api/drawing/one', {
                    params: {
                        id: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            get_update: function(defectId) {
                return $http.get($APP.server + '/api/defect/updates', {
                    params: {
                        defectId: defectId
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            get_original: function(id) {
                return $http.get($APP.server + '/api/drawing/original', {
                    params: {
                        id: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            create: function(dataIn, file) {
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/drawing/uploadfile',
                    params: {
                        file: file
                    },
                    data: dataIn
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            upload: function(dataIn, file) {
                var fd = new FormData();
                fd.append("file", file);
                fd.append("dto", new Blob([JSON.stringify(dataIn)], {
                    type: "application/json"
                }));
                return $http.post($APP.server + '/api/drawing/uploadfile', fd, {
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity,
                    params: {
                        dto: dataIn
                    }
                }).then(function successCallback(response) {}, function errorCallback(response) {});
            },
            test: function(dataIn, file) {
                $http({
                        method: 'POST',
                        url: '/upload-file',
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        data: {
                            dto: dataIn,
                            file: file
                        },
                        transformRequest: function(data, headersGetter) {
                            var formData = new FormData();
                            angular.forEach(data, function(value, key) {
                                if (key === 'drawing') {
                                    formData.append(key, JSON.stringify(value));
                                } else {
                                    formData.append(key, value);
                                }
                            });

                            var headers = headersGetter();
                            delete headers['Content-Type'];
                            return formData;
                        }
                    })
                    .success(function(data) {

                    })
                    .error(function(data, status) {

                    });
            },
            uploadFile: function(files) {
                var fd = new FormData();
                fd.append("file", files[0]);

                $http.post($APP.server + '/api/drawing/uploadfile', fd, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity
                }).success().error();
            },
            update: function(dataIn) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/drawing',
                    data: dataIn
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            delete: function(id) {
                return $http({
                    method: 'DELETE',
                    url: $APP.server + 'api/drawing',
                    params: {
                        id: id,
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            delete_drawings: function(idDTO) {
                return $http({
                    method: 'POST',
                    url: $APP.server + 'api/drawing/multiple',
                    data: idDTO
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            delete_photos: function(dataIn) {
                return $http({
                    method: 'DELETE',
                    url: $APP.server + 'api/defectphoto',
                    data: dataIn
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            create_comment: function(dataIn) {
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/defectcomment',
                    data: dataIn
                }).success(function(response) {}).error(function(response) {});
            },
            list_comments: function(id) {
                return $http.get($APP.server + '/api/defectcomment', {
                    params: {
                        defectId: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            create_photos: function(dataIn) {
                return $http({
                    method: 'POST',
                    url: $APP.server + 'api/defectphoto/uploadfiles',
                    data: dataIn
                }).success(function(response) {}).error(function(response) {});
            },
            list_photos: function(id) {
                return $http.get($APP.server + 'api/defectphoto/defect', {
                    params: {
                        defectId: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            list_defects: function(id) {
                return $http.get($APP.server + 'api/defect/drawing?', {
                    params: {
                        id: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            list_punchlist: function(id) {
                return $http.get($APP.server + 'api/punchList', {
                    params: {
                        projectId: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            },
            get_pdf_size: function(id) {
                return $http.get($APP.server + '/api/drawing/size', {
                    params: {
                        id: id
                    }
                }).then(
                    function(payload) {
                        return payload.data;
                    }
                );
            }
        };
    }
]);

angular.module($APP.name).service('fileUpload', ['$http', function($http) {
    this.uploadFileToUrl = function(file, uploadUrl) {
        var fd = new FormData();
        fd.append('file', file);

        $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            })

            .success(function() {})

            .error(function() {});
    }
}]);
