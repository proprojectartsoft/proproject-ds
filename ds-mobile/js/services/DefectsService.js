angular.module($APP.name).factory('DefectsService', [
  '$http',
  '$rootScope',
  function ($http, $rootScope) {
    return {
      list: function (projectId) {
        return $http.get($APP.server + 'api/defect', {
          params: {projectId: projectId}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      reports: function (projectId) {
        return $http.get($APP.server + 'api/pdf_controller/downloadDsReport', {
          params: {projectId: projectId}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      related_tasks_new: function (projectId) {
        return $http.get($APP.server + 'api/defect/relatedtasks', {
          params: {projectId: projectId}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      related_tasks_update: function (projectId, defectId) {
        return $http.get($APP.server + 'api/defect/relatedtasks', {
          params: {projectId: projectId, defectId: defectId}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      list_small: function (projectId) {
        return $http.get($APP.server + 'api/defect/small', {
          params: {projectId: projectId}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      get: function (id) {
        return $http.get($APP.server + '/api/defect', {
          params: {id: id}
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
          url: $APP.server + '/api/defect',
          data: dataIn
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      update: function (dataIn) {
        return $http({
          method: 'PUT',
          url: $APP.server + '/api/defect',
          data: dataIn
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      delete_photos: function (dataIn) {
        console.log(dataIn)
        return $http({
          method: 'POST',
          url: $APP.server + 'api/defectphoto',
          data: dataIn
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      delete_defect: function (id) {
        return $http({
          method: 'DELETE',
          url: $APP.server + 'api/defect',
          params: {
            id: id,
          }
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
          url: $APP.server + '/api/defectcomment',
          data: dataIn
        }).success(function (response) {
        }).error(function (response) {
        });
      },
      list_comments: function (id) {
        return $http.get($APP.server + '/api/defectcomment', {
          params: {defectId: id}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      create_photos: function (dataIn) {
        console.log(dataIn, 'tigan banana')
        return $http({
          method: 'POST',
          url: $APP.server + 'api/defectphoto/uploadfiles',
          data: dataIn
        }).success(function (response) {
        }).error(function (response) {
        });
      },
      list_photos: function (id) {
        return $http.get($APP.server + 'api/defectphoto/defect', {
          params: {defectId: id}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      },
      list_punchlist: function (id) {
        return $http.get($APP.server + 'api/punchList', {
          params: {projectId: id}
        }).then(
          function (payload) {
            return payload.data;
          }
        );
      }
    };
  }
]);
