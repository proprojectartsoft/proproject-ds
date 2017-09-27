dsApp.factory('ConvertersService', ConvertersService)

ConvertersService.$inject = ['$http', '$rootScope', '$filter']

function ConvertersService($http, $rootScope, $filter) {
    var service = {
        init_defect: init_defect,
        save_defect: save_defect,
        save_local: save_local,
        increase_nr_tasks: increase_nr_tasks,
        decrease_nr_tasks: decrease_nr_tasks,
        clear_id: clear_id,
        getEmptyDefect: getEmptyDefect,
        add_task_for_subcontractor: add_task_for_subcontractor,
        remove_task_for_subcontractor: remove_task_for_subcontractor,
        get_defect_for_create: get_defect_for_create,
        get_defect_for_update: get_defect_for_update
    }
    return service;

    function init_defect(data) {
        if (data) {
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
        }
        return data;
    }

    function save_defect(data) {
        data.status_id = data.status_obj.id
        data.status_name = data.status_obj.name
        data.severity_id = data.severity_obj.id
        data.severity_name = data.severity_obj.name
        data.priority_id = data.priority_obj.id
        data.priority_name = data.priority_obj.name
        return data;
    }

    function save_local(drawing) {
        return {
            "base64String": drawing.base64String,
            "closed_out_defects": drawing.closed_out_defects,
            "completed_defects": drawing.completed_defects,
            "contested_defects": drawing.contested_defects,
            "delayed_defects": drawing.delayed_defects,
            "incomplete_defects": drawing.incomplete_defects,
            "partially_completed_defects": drawing.partially_completed_defects,
            "code": drawing.code,
            "drawing_date": drawing.drawing_date,
            "file_name": drawing.file_name,
            "id": drawing.id,
            "nr_of_defects": drawing.nr_of_defects + 1,
            "pdfPath": drawing.pdfPath,
            "project_id": drawing.project_id,
            "resized_path": drawing.resized_path,
            "revision": drawing.revision,
            "title": drawing.title,
            "relatedDefects": drawing.relatedDefects,
            "markers": []
        };
    }

    function increase_nr_tasks(subcontr, task) {
        switch (task) {
            case "Complete":
                subcontr.completed_tasks++;
                break;
            case "Incomplete":
                subcontr.incomplete_tasks++;
                break;
            case "Partially Completed":
                subcontr.partially_completed_tasks++;
                break;
            case "Delayed":
                subcontr.delayed_tasks++;
                break;
            case "Contested":
                subcontr.contested_tasks++;
                break;
            case "Closed Out":
                subcontr.closed_out_tasks++;
                break
            default:
                subcontr.incomplete_tasks++;
        }
    }

    function decrease_nr_tasks(subcontr, task) {
        switch (task) {
            case "Complete":
                subcontr.completed_tasks--;
                break;
            case "Incomplete":
                subcontr.incomplete_tasks--;
                break;
            case "Partially Completed":
                subcontr.partially_completed_tasks--;
                break;
            case "Delayed":
                subcontr.delayed_tasks--;
                break;
            case "Contested":
                subcontr.contested_tasks--;
                break;
            case "Closed Out":
                subcontr.closed_out_tasks--;
                break
            default:
                subcontr.incomplete_tasks--;
        }
    }

    function add_task_for_subcontractor(task, subcontractors) {
        if (task.assignee_id) {
            //search the new assignee having the id 'assignee_id' through the subcontractors list
            var subcontr = $filter('filter')(subcontractors, {
                id: task.assignee_id
            })[0];
            //if the new assignee is a subcontractor, add the task to his tasks list
            if (subcontr) {
                subcontr.isModified = true;
                increase_nr_tasks(subcontr, task.status_name);
                //keep all tasks except for the new task given by id, if it is already in that list
                subcontr.tasks = $filter('filter')(subcontr.tasks, {
                    id: ('!' + task.id)
                }) || [];
                //add the new task
                subcontr.tasks.push(task);
            }
        }
    }

    function remove_task_for_subcontractor(task, subcontractors, assignee_id) {
        //search the old assignee having the id 'assignee_id' through the subcontractors list
        var subcontr = $filter('filter')(subcontractors, {
            id: assignee_id
        })[0];
        //if the old assignee is a subcontractor, remove the task from his tasks list
        if (subcontr) {
            // remove from old assignee related list
            subcontr.tasks = $filter('filter')(subcontr.related, {
                id: ('!' + task.id)
            });
            //derease the number of tasks corresponding to task's status
            decrease_nr_tasks(subcontr, task.status_name);
            subcontr.isModified = true;
        }
    }

    function clear_id(defect) {
        var def = angular.copy(defect);
        def.id = 0;
        return def;
    }

    function getEmptyDefect() {
        var defect = {};
        defect.id = 0;
        defect.active = true;
        defect.project_id = $rootScope.projId;
        defect.defect_id = 0;
        defect.related_tasks = [];
        defect.due_date = 0;
        defect.drawing = null;
        defect.photos = [];
        defect.comments = [];
        defect.status_obj = {
            id: 0,
            name: 'Incomplete'
        };
        defect.severity_obj = {
            id: 0,
            name: 'None'
        };
        defect.priority_obj = {
            id: 0,
            name: 'None'
        };

        var user = "";
        if ($rootScope.users && $rootScope.users.length) {
            user = $filter('filter')($rootScope.users, {
                login_name: localStorage.getObject('ds.user') && localStorage.getObject('ds.user').name
            })[0];
            if (user) {
                defect.assignee_name = user.first_name + " " + user.last_name;
                defect.assignee_id = user.id;
            }
        } else {
            defect.assignee_name = "";
            defect.assignee_id = 0;
        }
        return defect;
    }

    function get_defect_for_create(defect) {
        def = {
            active: defect.active,
            project_id: defect.project_id,
            cost: defect.cost,
            due_date: new Date(defect.due_date).getTime(),
            location: defect.location,
            title: defect.title,
            priority_id: defect.priority_id,
            severity_id: defect.severity_id,
            status_id: defect.status_id,
            description: "",
            related_tasks: []
        }

        angular.forEach(defect.related_tasks, function(rel) {
            def.related_tasks.push({
                id: rel.id
            })
        })
        return def;
    }

    function get_defect_for_update(defect) {
        var def = {
            id: defect.id,
            reporter_id: defect.reporter_id,
            assignee_id: defect.assignee_id,
            active: defect.active,
            project_id: defect.project_id,
            due_date: new Date(defect.due_date).getTime(),
            location: defect.location,
            title: defect.title,
            description: defect.description,
            cost: defect.cost,
            related_tasks: [],
            priority_id: defect.priority_id,
            severity_id: defect.severity_id,
            status_id: defect.status_id
        }
        angular.forEach(defect.related_tasks, function(rel) {
            def.related_tasks.push({
                id: rel.id
            })
        })
        return def;
    }
};
