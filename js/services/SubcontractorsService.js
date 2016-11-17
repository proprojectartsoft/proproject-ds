angular.module($APP.name).factory('SubcontractorsService', [
    '$http',
    '$rootScope',
    function ($http, $rootScope) {
        return {
            list: function (projectId) {
                return $http.get($APP.server + '/api/subcontractor', {
                    params: {projectId: projectId}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            list_defects: function (projectId, subcontractorId) {
                return $http.get($APP.server + 'api/subcontractor/tasks', {
                    params: {projectId: projectId, subcontractorId: subcontractorId}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            get: function (subcontractorId) {
                return $http.get($APP.server + '/api/subcontractor', {
                    params: {subcontractorId: subcontractorId}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            create: function (dataIn) {
                console.log(dataIn)
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/subcontractor',
                    data: dataIn,
                    params: {projectId: localStorage.getObject('dsproject').id}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            invite: function (dataIn) {
                console.log(dataIn)
                var email = 'a@a'
                var projectId = 1
                var aux = {
                    email: dataIn,
                    customerId: 0,
                    company_admin: false
                }
                return $http({
                    method: 'POST',
                    url: $APP.server + 'api/invite/subcontractor?email=' + dataIn + '&projectId=' + localStorage.getObject('dsproject').id
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            update: function (dataIn) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/subcontractor',
                    data: dataIn
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            delete: function (subcontractorId) {
                return $http({
                    method: 'DELETE',
                    url: $APP.server + 'api/subcontractor?subcontractorId=' + subcontractorId + '&projectId=' + localStorage.getObject('dsproject').id

                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            create_comment: function (dataIn) {
                console.log(dataIn)
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/subcontractor/comments',
                    data: dataIn,
                    params: {projectId: localStorage.getObject('dsproject').id}
                }).success(function (response) {
                }).error(function (response) {
                });
            },
            list_comments: function (subcontractorId) {
                return $http.get($APP.server + '/api/subcontractor/comments', {
                    params: {subcontractorId: subcontractorId}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            signup: function (dataIn) {
                console.log(dataIn)
                return $http({
                    method: 'POST',
                    url: $APP.server + '/pub/signup/subcontractor',
                    data: dataIn
                }).success(function (response) {
                }).error(function (response) {
                });
            }
        };
    }
]);
