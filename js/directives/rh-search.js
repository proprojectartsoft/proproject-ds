
angular.module($APP.name).directive('rhSearch', [
    'InstancesService',
    'SweetAlert',
    'DesignsService',
    'PayitemService',
    'ResourceService',
    'SchedulingService',
    'StaffService',
    '$stateParams',
    '$http',
    'ImageService',
    '$rootScope',
    'createDialog',
    function (InstancesService, SweetAlert, DesignsService, PayitemService, ResourceService, SchedulingService, StaffService, $stateParams, $http, ImageService, $rootScope, createDialog) {
        return {
            restrict: 'EA',
            link: link,
            scope: {
                'dial': '=',
                'filters': '=',
                'someCtrlFn': '&callback'
            },
            templateUrl: 'templates/_search.html'
        };
        function link($scope, $elem, $attrs, $ctrl) {
            $scope.active = false;
            $scope.filter = {};
            $scope.dataPreview = {};
            $scope.backup = {};

            $scope.toggle = function (predicate, id) {
                if (predicate) {
                    $scope.active = true;
                    $scope.parseService(id);
                } else {
                    $scope.active = false;
                    delete $scope.filter.payitem;
                    delete $scope.filter.res;
                    delete $scope.filter.subtask;
                    delete $scope.filter.subres;
                    delete $scope.filter.staff;
                }
            };

            $scope.parseService = function (id) {
                if ($scope.filter.state === 'design') {
                    $scope.hasDownload = false;
                    DesignsService.get(id).then(function (result) {
                        $scope.design = result;
                        angular.forEach($scope.design.field_group_designs, function (group) {
                            angular.forEach(group.field_designs, function (field) {
                                if (field.type === 'date') {
                                    field.parsed_model = new Date();
                                }
                            });
                        });
                    })
                }
                if ($scope.filter.state === 'instance') {
                    $scope.hasDownload = true;
                    InstancesService.get(id).then(function (data) {
                        $scope.dataPreview = $scope.parseData(data);
                        $scope.aux = $APP.server + '/api/pdf_controller/downloadPDF?formId=' + data.id;
                        if (data.pay_item_field_id && data.pay_item_field_id !== "0                       ") {
                            PayitemService.get_field(data.pay_item_field_id).then(function (result) {
                                $scope.payitemField = result;
                                $scope.payitemField.total_cost = 0;
                                angular.forEach($scope.payitemField.pay_items, function (item) {
                                    var total = 0;
                                    if (item.resources) {
                                        angular.forEach(item.resources, function (item) {
                                            if (item.direct_cost === 0) {
                                                item.direct_cost = 0;
                                            }
                                            if (item.quantity === 0) {
                                                item.quantity = 0;
                                            }
                                            total = total + item.direct_cost * item.quantity;
                                        });
                                    }
                                    if (item.subtasks) {
                                        angular.forEach(item.subtasks, function (item) {
                                            angular.forEach(item.resources, function (res) {
                                                if (res.direct_cost === 0) {
                                                    res.direct_cost = 0;
                                                }
                                                if (res.quantity === 0) {
                                                    res.quantity = 0;
                                                }
                                                total += res.direct_cost * res.quantity;
                                            });
                                        });
                                    }
                                    $scope.payitemField.total_cost = $scope.payitemField.total_cost + total;
                                })
                            })
                        }
                        if (data.resource_field_id && data.resource_field_id !== "0                       ") {
                            ResourceService.get_field(data.resource_field_id).then(function (result) {
                                $scope.resourceField = result;
                                if ($scope.resourceField.financial_option) {
                                    $scope.resourceField.total = 0;
                                }
                                angular.forEach($scope.resourceField.resources, function (item) {
                                    if ($scope.resourceField.financial_option) {
                                        $scope.resourceField.total = $scope.resourceField.total + item.direct_cost * item.quantity;
                                    }
                                    angular.forEach($scope.resourcetypes, function (restypes) {
                                        if (restypes.id === item.resource_type_id) {
                                            item.res_type_obj = restypes;
                                        }
                                    });
                                    angular.forEach($scope.units, function (unit) {
                                        if (unit.id === item.unit_id) {
                                            item.unit_obj = unit;
                                        }
                                    });
                                })
                            })
                        }
                        if (data.scheduling_field_id && data.scheduling_field_id !== "0                       ") {
                            SchedulingService.get_field(data.scheduling_field_id).then(function (result) {
                                $scope.payitemField = result;
                            })
                        }
                        if (data.staff_field_id && data.staff_field_id !== "0                       ") {
                            StaffService.get_field(data.staff_field_id).then(function (result) {
                                $scope.staffField = result;
                                angular.forEach($scope.staffField.resources, function (item) {
                                    angular.forEach($scope.resourcetypes, function (restypes) {
                                        if (restypes.name === item.resource_type_name) {
                                            item.res_type_obj = restypes;
                                        }
                                    });
                                    angular.forEach($scope.absenteeisms, function (unit) {
                                        if (unit.reason === item.abseteeism_reason_name) {
                                            item.absenteeism_obj = unit;
                                        }
                                    });
                                })
                            })
                        }
                    });
                }
            };

            $scope.parseData = function (data) {
                angular.forEach(data.field_group_instances, function (group) {
                    angular.forEach(group.field_instances, function (field) {
                        if (field.type === 'checkbox_list') {
                            angular.forEach(field.field_values, function (values) {
                                if (values.value === 'true' || values.value === true) {
                                    values.value = true;
                                } else {
                                    values.value = false;
                                }
                            });
                        }
                        if (field.type === 'checkbox') {
                            if (field.field_values[0].value === 'true' || field.field_values[0].value === true) {
                                field.field_values[0].value = true;
                                field.value = true;
                            } else {
                                field.field_values[0].value = false;
                                field.value = false;
                            }
                        }
                        if (field.type === 'radio') {
                            angular.forEach(field.field_values, function (values) {
                                if (values.value === 'true' || values.value === true) {
                                    field.value = values.name;
                                }
                            });
                        }
                        if (field.type === 'select') {
                            angular.forEach(field.field_values, function (values) {
                                if (values.value === 'true' || values.value === true) {
                                    field.value = values;
                                }
                            });
                        }
                        if (field.type === "date") {
                            var aux = '';
                            if (field.field_values[0].value !== "") {
                                if (field.field_values[0].value !== 0) {
                                    aux = field.field_values[0].value.substr(0, 4);
                                    var array = [];
                                    array.push(field.field_values[0].value.substr(3, 2))
                                    array.push(field.field_values[0].value.substr(0, 2));
                                    array.push(field.field_values[0].value.substr(6, 4));
                                }
                                if (field.field_values[0].value !== '0' && field.field_values[0].value !== 0 && aux !== '1969') {
                                    field.field_values[0].value = new Date(array[2], array[0], array[1]);
                                } else {
                                    field.field_values[0].value = new Date(null);
                                }
                            }
                        }
                        if (field.type === "time") {
                            if (field.field_values[0] && field.field_values[0].value !== '0' && field.field_values[0].value !== 0 && field.field_values[0].value !== "") {
                                field.field_values[0].value = new Date("Mon, 25 Dec 1995 " + field.field_values[0].value)
                            }
                        }
                        if (field.type === "signature") {
                            field.edit = false;
                        }
                    });
                });
                return data;
            }


            $scope.toggleCancel = function () {
                $scope.dataPreview = angular.copy($scope.backup.data);
                $scope.edit = false;
            }

            $scope.changeSubState = function (predicate) {
                $scope.filter.substate = predicate;
            };
            $scope.doTotalTo = function (predicate, data) {
                if (predicate === 'payitem') {
                    if (data) {
                        data.doTotal = 0;
                        if (data.resources) {
                            angular.forEach(data.resources, function (item) {
                                if (item.direct_cost === 0) {
                                    item.direct_cost = 0;
                                }
                                if (item.quantity === 0) {
                                    item.quantity = 0;
                                }
                                data.doTotal = data.doTotal + item.direct_cost * item.quantity;
                            });
                        }
                        if (data.subtasks) {
                            angular.forEach(data.subtasks, function (item) {
                                angular.forEach(item.resources, function (res) {
                                    if (res.direct_cost === 0) {
                                        res.direct_cost = 0;
                                    }
                                    if (res.quantity === 0) {
                                        res.quantity = 0;
                                    }
                                    data.doTotal += res.direct_cost * res.quantity;
                                });
                            });
                        }
//                    data.doTotal = data.doTotal * data.quantity;
                        if (isNaN(data.doTotal)) {
                            return 0;
                        } else {
                            return data.doTotal;
                        }
                    }
                }
                if (predicate === 'subtask') {
                    if (data) {
                        data.doTotal = 0;
                        angular.forEach(data.resources, function (item) {
                            if (item.direct_cost === 0) {
                                item.direct_cost = 0;
                            }
                            if (item.quantity === 0) {
                                item.quantity = 0;
                            }
                            data.doTotal = data.doTotal + item.direct_cost * item.quantity;
                        });
                        if (isNaN(data.doTotal)) {
                            return 0;
                        } else {
                            return data.doTotal;
                        }
                    }
                }
                if (predicate === 'resource') {
                    if (data) {
                        if (!data.staff) {
                            if (data.calculation) {
                                if (data.unit_obj) {
                                    if (data.unit_obj.name === 'm' || data.unit_obj.name === 'ft') {
                                        if (data.wastage) {
                                            data.quantity = data.length + (data.length * data.wastage) / 100;
                                        } else {
                                            data.quantity = data.length;
                                        }
                                    }
                                    if (data.unit_obj.name === 'Days') {
                                        data.quantity = data.days * data.number_of;
                                    }
                                    if (data.unit_obj.name === 'm2' || data.unit_obj.name === 'ft2') {
                                        if (data.wastage) {
                                            data.quantity = data.length * data.width + (data.length * data.width * data.wastage) / 100;
                                        } else {
                                            data.quantity = data.length * data.width;
                                        }
                                    }
                                    if (data.unit_obj.name === 'm3' || data.unit_obj.name === 'ft3') {
                                        if (data.wastage) {
                                            data.quantity = data.length * data.width * data.depth + (data.length * data.width * data.depth * data.wastage) / 100;
                                        } else {
                                            data.quantity = data.length * data.width * data.depth;
                                        }
                                    }
                                    if (data.unit_obj.name === 'T') {
                                        if (data.wastage) {
                                            data.quantity = data.length * data.width * data.depth * data.tm3 + (data.length * data.width * data.depth * data.tm3 * data.wastage) / 100;
                                        } else {
                                            data.quantity = data.length * data.width * data.depth * data.tm3;
                                        }

                                    }
                                    data.quantity = Math.round(data.quantity * 100) / 100
                                    data.total = data.quantity * data.direct_cost;
                                    data.total = Math.round(data.total * 100) / 100
                                } else {
                                    data.total = 0;
                                }
                            } else {
                                data.total = data.quantity * data.direct_cost;
                            }
                        } else {
                            if (data.break_time && data.finish_time && data.start_time) {
                                var min, hr;
                                if (data.break_time === '00:00') {
                                    min = parseInt(data.finish_time.split(":")[1]) - parseInt(data.start_time.split(":")[1])
                                    hr = parseInt(data.finish_time.split(":")[0]) - parseInt(data.start_time.split(":")[0])
                                    if (min < 0) {
                                        min = 60 + min;
                                        hr--;
                                    }
                                } else {
                                    min = parseInt(data.finish_time.split(":")[1]) - parseInt(data.start_time.split(":")[1]) - parseInt(data.break_time.split(":")[1])
                                    hr = parseInt(data.finish_time.split(":")[0]) - parseInt(data.start_time.split(":")[0]) - parseInt(data.break_time.split(":")[0])
                                    if (min < 0) {
                                        min = 60 + min;
                                        hr--;
                                    }
                                }
                                data.total_time = hr + ":" + min;
                                data.total = hr * data.direct_cost + hr * data.direct_cost / 60;
                                data.total = Math.round(data.total * 100) / 100
                            }
                        }
                        if (isNaN(data.total)) {
                            data.total = 0;
                            return 0;
                        } else {
                            return data.total;
                        }
                    }
                }
            }
            $scope.doTotal = function (predicate) {
                if (predicate === 'payitem') {
                    if ($scope.filter.payitem) {
                        $scope.filter.payitem.doTotal = 0;
                        if ($scope.filter.payitem.resources) {
                            angular.forEach($scope.filter.payitem.resources, function (item) {
                                if (item.direct_cost === 0) {
                                    item.direct_cost = 0;
                                }
                                if (item.quantity === 0) {
                                    item.quantity = 0;
                                }
                                $scope.filter.payitem.doTotal = $scope.filter.payitem.doTotal + item.direct_cost * item.quantity;
                            });
                        }
                        if ($scope.filter.payitem.subtasks) {
                            angular.forEach($scope.filter.payitem.subtasks, function (item) {
                                angular.forEach(item.resources, function (res) {
                                    if (res.direct_cost === 0) {
                                        res.direct_cost = 0;
                                    }
                                    if (res.quantity === 0) {
                                        res.quantity = 0;
                                    }
                                    $scope.filter.payitem.doTotal += res.direct_cost * res.quantity;
                                });
                            });
                        }
                        $scope.filter.payitem.doTotal = $scope.filter.payitem.doTotal * $scope.filter.payitem.quantity;
                        if (isNaN($scope.filter.payitem.doTotal)) {
                            return 0;
                        } else {
                            return $scope.filter.payitem.doTotal;
                        }
                    }
                }
                if (predicate === 'subtask') {
                    if ($scope.filter.subtask) {
                        $scope.filter.subtask.doTotal = 0;
                        angular.forEach($scope.filter.subtask.resources, function (item) {
                            if (item.direct_cost === 0) {
                                item.direct_cost = 0;
                            }
                            if (item.quantity === 0) {
                                item.quantity = 0;
                            }
                            $scope.filter.subtask.doTotal = $scope.filter.subtask.doTotal + item.direct_cost * item.quantity;
                        });
                        if (isNaN($scope.filter.subtask.doTotal)) {
                            return 0;
                        } else {
                            return $scope.filter.subtask.doTotal;
                        }
                    }
                }
                if (predicate === 'resource') {
                    if ($scope.filter.res) {
                        if ($scope.filter.res.direct_cost === 0) {
                            $scope.filter.res.direct_cost = 0;
                        }
                        if ($scope.filter.res.quantity === 0) {
                            $scope.filter.res.quantity = 0;
                        }
                        $scope.filter.res.doTotal = $scope.filter.res.direct_cost * $scope.filter.res.quantity;
                        if (isNaN($scope.filter.res.doTotal)) {
                            return 0;
                        } else {
                            return $scope.filter.res.doTotal;
                        }
                    }
                }
            }


            $scope.fieldToggle = function (field, link) {
                if (field === 'resource') {
                    if (link.open === true) {
                        angular.forEach($scope.resourceField.resources, function (item) {
                            item.open = false;
                        });
                        delete $scope.filter.res;
                    } else {
                        angular.forEach($scope.resourceField.resources, function (item) {
                            item.open = false;
                        });
                        link.open = true;
                        $scope.filter.res = link;
                    }
                }
            }

            $scope.openStaff = function (staff) {
                if (staff.open === true) {
                    staff.open = false;
                    delete $scope.filter.staff;
                } else {
                    if ($scope.filter.staff) {
                        $scope.filter.staff.open = false;
                    }
                    $scope.filter.staff = staff;
                    $scope.filter.staff.open = true;
                }
            };

            $scope.openPayitem = function (payitem) {
                if (!$scope.filter.payitem) {
                    if ($scope.filter.subtask) {
                        $scope.filter.subtask.open = false;
                        delete $scope.filter.subtask;
                    }
                    if ($scope.filter.subres) {
                        $scope.filter.subres.open = false;
                        delete $scope.filter.subres;
                    }
                    $scope.filter.payitem = payitem;
                    $scope.filter.payitem.open = true;
                }
            };
            $scope.closePayitem = function () {
                $scope.filter.payitem.open = false;
                if ($scope.filter.subtask) {
                    $scope.filter.subtask.open = false;
                    delete $scope.filter.subtask;
                }
                if ($scope.filter.subres) {
                    $scope.filter.subres.open = false;
                    delete $scope.filter.subres;
                }
                delete $scope.filter.payitem;
                $scope.payitemField.total_cost = 0;
                angular.forEach($scope.payitemField.pay_items, function (item) {
                    var total = 0;
                    if (item.resources) {
                        angular.forEach(item.resources, function (item) {
                            if (item.direct_cost === 0) {
                                item.direct_cost = 0;
                            }
                            if (item.quantity === 0) {
                                item.quantity = 0;
                            }
                            total = total + item.direct_cost * item.quantity;
                        });
                    }
                    if (item.subtasks) {
                        angular.forEach(item.subtasks, function (item) {
                            angular.forEach(item.resources, function (res) {
                                if (res.direct_cost === 0) {
                                    res.direct_cost = 0;
                                }
                                if (res.quantity === 0) {
                                    res.quantity = 0;
                                }
                                total += res.direct_cost * res.quantity;
                            });
                        });
                    }
                    $scope.payitemField.total_cost = $scope.payitemField.total_cost + total;
                })
            };
            $scope.openSubtask = function (subtask) {
                if ($scope.filter.subres) {
                    $scope.filter.subres.open = false;
                    delete $scope.filter.subres;
                }
                if (subtask.open === true) {
                    subtask.open = false;
                    delete $scope.filter.subtask;
                } else {
                    if ($scope.filter.subtask) {
                        $scope.filter.subtask.open = false;
                    }
                    $scope.filter.subtask = subtask;
                    $scope.filter.subtask.open = true;
                }
            };
            $scope.openSubres = function (subres) {
                if (subres.open === true) {
                    subres.open = false;
                    delete $scope.filter.subres;
                } else {
                    if ($scope.filter.subres) {
                        $scope.filter.subres.open = false;
                    }
                    $scope.filter.subres = subres;
                    $scope.filter.subres.open = true;
                }
            };
            $scope.openRes = function (res) {
                if ($scope.filter.subres) {
                    $scope.filter.subres.open = false;
                    delete $scope.filter.subres;
                }
                if ($scope.filter.subtask) {
                    $scope.filter.subtask.open = false;
                    delete $scope.filter.subtask;
                }
                if (res.open === true) {
                    res.open = false;
                    delete $scope.filter.res;
                } else {
                    if ($scope.filter.res) {
                        $scope.filter.res.open = false;
                    }
                    $scope.filter.res = res;
                    $scope.filter.res.open = true;
                }
                if (!$scope.filter.res && $scope.resourceField) {
                    $scope.resourceField.total = 0;
                    if ($scope.resourceField.resources) {
                        angular.forEach($scope.resourceField.resources, function (item) {
                            if (item.direct_cost === 0) {
                                item.direct_cost = 0;
                            }
                            if (item.quantity === 0) {
                                item.quantity = 0;
                            }
                            $scope.resourceField.total = $scope.resourceField.total + item.direct_cost * item.quantity;
                        });
                    }
                }
            };


            $scope.$watch('dial', function (value) {
                if (value) {
                    $scope.filter.state = value.state
                    $scope.filter.substate = 'form';
                    $scope.toggle(value.predicate, value.id);
                    $scope.hideEdit = true;
                    $scope.hasDelete = false;
                    $scope.edit = false;
                    $scope.create = false;
                }
            });
            $scope.$on('$destroy', function () {
                $scope.active = false;
                $scope.edit = false;
                $scope.dataPreview = {};
            });

        }
    }
])