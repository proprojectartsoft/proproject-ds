angular.module($APP.name).service('ConvertersService', [
    '$http',
    '$rootScope',
    'CacheFactory',
    function ($http, $rootScope, CacheFactory) {
        var filter = {};
        filter.severity = [
            {
                id: 0,
                name: 'None'
            },
            {
                id: 1,
                name: 'Information'
            },
            {
                id: 2,
                name: 'Minor'
            },
            {
                id: 3,
                name: 'Normal'
            },
            {
                id: 4,
                name: 'Major'
            },
            {
                id: 5,
                name: 'Other'
            }
        ];
        filter.priority = [
            {
                id: 0,
                name: 'None'
            },
            {
                id: 1,
                name: 'Low'
            },
            {
                id: 2,
                name: 'Medium'
            },
            {
                id: 3,
                name: 'High'
            },
            {
                id: 4,
                name: 'Critical'
            },
            {
                id: 5,
                name: 'Other'
            }
        ];
        return {
            create_defect: function (data) {
                var requestData = {};
                requestData.active = true;
                requestData.reporter_id = 0;
                requestData.reporter_name = "";
                requestData.project_id = data.project_id;
                requestData.currency_id = data.currency_id;
                requestData.title = data.title;
                requestData.location = data.location;
                requestData.description = data.description;
                requestData.cost = data.cost;
                requestData.related_tasks = data.related_tasks;
                requestData.photos = data.photos;

                if (data.priority_obj) {
                    requestData.priority_id = data.priority_obj.id;
                    requestData.priority_name = data.priority_obj.name;
                }
                else {
                    requestData.priority_id = 0;
                    requestData.priority_name = "None";
                }
                if (data.severity_obj) {
                    requestData.severity_id = data.severity_obj.id;
                    requestData.severity_name = data.severity_obj.name;
                }
                else {
                    requestData.severity_id = 0;
                    requestData.severity_name = "None";
                }
                if (data.status_obj) {
                    requestData.status_id = data.status_obj.id;
                    requestData.status_name = data.status_obj.name;
                }
                else {
                    requestData.status_id = 0;
                    requestData.status_name = "Incomplete";
                }
                if (data.assignee_obj) {
                    requestData.assignee_id = data.assignee_obj.id;
                    requestData.assignee_name = data.assignee_obj.name;
                }
                if (data.date_obj) {
                    requestData.due_date = data.date_obj.getTime();
                }
                return requestData;
            },
            update_defect: function (data) {
                var requestData = angular.copy(data);

                if (data.priority_obj) {
                    requestData.priority_id = data.priority_obj.id;
                    requestData.priority_name = data.priority_obj.name;
                }
                if (data.severity_obj) {
                    requestData.severity_id = data.severity_obj.id;
                    requestData.severity_name = data.severity_obj.name;
                }
                if (data.status_id) {
                    requestData.status_id = data.status_id;
                    requestData.status_name = data.status_name;
                }
                else {
                    requestData.status_id = 0;
                    requestData.status_name = "Incomplete";
                }
                if (data.assignee_obj) {
                    requestData.assignee_id = data.assignee_obj.id;
                    requestData.assignee_name = data.assignee_obj.name;
                }
                 if (data.date_obj) {
                    requestData.due_date = data.date_obj.getTime();
                }
                
                return requestData;
            },
            preview_defect: function (data) {
                var requestData = {};
                requestData = angular.copy(data);
                requestData.severity_obj = {id: requestData.severity_id, name: requestData.severity_name};
                requestData.priority_obj = {id: requestData.priority_id, name: requestData.priority_name};
                requestData.status_obj = {id: requestData.status_id, name: requestData.status_name};
                requestData.date_obj = new Date(requestData.due_date);
                return requestData;
            },
            camelcase: function (str) {
                return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
                    if (+match === 0)
                        return ""; // or if (/\s+/.test(match)) for white spaces
                    return index == 0 ? match.toLowerCase() : match.toUpperCase();
                });
            }
        };
    }
]);