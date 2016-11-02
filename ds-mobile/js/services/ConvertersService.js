angular.module($APP.name).factory('ConvertersService', ConvertersService)

ConvertersService.$inject = ['$http']

function ConvertersService($http) {
    var service = {
        init_defect: init_defect
    }
    return service;

    function init_defect(data) {
      console.log(data);
        data.status_obj = {
            id: data.status_id,
            name: data.status_name
        };
        data.severity_obj = {
            id: data.severity_id,
            name: data.severity_name
        };
        data.priority_obj = {
            id: data.priority_id,
            name: data.priority_name
        };
        return data;
    }

};
