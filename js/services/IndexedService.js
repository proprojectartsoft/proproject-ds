dsApp.service('IndexedService', ['$q', function($q) {
    var schemaBuilder,
        dsDb,
        projects,
        settings,
        connectionReady,
        service = this;

    service.createDB = function(callback) {
        // SQL equivalent: CREATE DATABASE IF NOT EXISTS projects
        // This schema definition (or data definition commands in SQL, DDL) is not
        // executed immediately. Lovefield uses builder pattern to build the schema
        // first, then performs necessary database open/creation later.
        try {
            //creating dexie table
            schemaBuilder = new Dexie('DS');
            console.log('creating dexie table');
        } catch (e) {
            console.log('Error creating new DB: ', e);
            callback({
                error: e,
                finished: true
            });
            return false;
        }

        // SQL equivalent:
        // CREATE TABLE IF NOT EXISTS projects (
        //   version AS STRING,
        //   projects_id AS STRING,
        //   event_type as STRING,
        //   event_id as STRING,
        //   PRIMARY KEY ON ('projects_id')
        // );
        try {
            //adding columns to the dexie table
            console.log('creating dexie table columns');
            schemaBuilder.version(24).stores({
              projects: 'id,value'
            });
        } catch (e) {
            console.log('Error creating table projects: ', e);
            callback({
                finished: true,
                error: e
            });
            return false;
        }
    };

    service.runCommands = function(e, callback) {
        var params = e.data,
            operation = e.operation;

        if (!connectionReady) {
            //opening the dexie table
            console.log('oppeining database');
            connectionReady = schemaBuilder.open().catch(function(error) {
		            console.log('Uh oh : ' + error);
	          });
        }

        connectionReady.then(function(db) {
            dsDb = db;

            switch (operation) {
                case 'setProjects':
                    try {
                        service.setProjects(params, function(records) {
                            try {
                                callback({
                                    finished: true
                                });
                            } catch (e) {
                                throw ('Error inserting:' + e);
                            }
                        });
                    } catch (e) {
                        throw ('Error uploading: ' + e);
                    }
                    break;
                case 'getProjects':
                    try {
                        service.getProjects(function(result) {
                            callback({
                                results: result,
                                finished: true
                            });
                        });
                    } catch (e) {
                        throw ('Error fetching:' + e);
                    }
                    break;
                case 'getProject':
                    try {
                        service.getProject(params, function(result) {
                            callback({
                                results: result,
                                finished: true
                            });
                        });
                    } catch (e) {
                        throw ('Error fetching:' + e);
                    }
                    break;
                case 'eraseDb':
                console.log('deleting database');
                    dsDb.projects.clear().then(function() {
                            callback({
                                results: 0,
                                finished: true
                            });
                        });
                    break;
            }
        });
    };

    service.setProjects = function(data, callback) {
            //adding the info to the dexie table
            parseData = function(data) {
                var dt = [],
                    object = false;
                for (var i = 0; i < data.length; i++) {
                    dt.push(data[i]);
                }
              if (dt.length > 1) {
                  //adding all the info in the dexie table as an array
                  dsDb.projects.bulkAdd(dt).then(function (lastKey){
                    // console.log('The last id inserted was: ', lastKey);
                    console.log('adding projects to the database', dt);
                    callback(lastKey);
                  }).catch(Dexie.bulkError, function(e) {
                    console.log('Error inserting in dexie: ', e);
                    callback(false);
                  });
              } else {
                //updating a specific object in the dexie table
                dsDb.projects.update(dt[0].id, dt[0]).then(function (updated){
                  // console.log('Updated element: ', updated);
                  callback(updated);
                  console.log('adding project to the database', dt);
                }).catch(Dexie.bulkError, function(e) {
                  console.log('Error updating dexie: ', e);
                  callback(false);
                });
              }
            };
        parseData(data);
    };

    service.getProjects = function(callback) {
        //getting all the projects from the table
        console.log('getting projects form database in indexed Service');

        dsDb.projects.where('id').between(0, 100000).toArray(function (projects) {
              callback(projects);
        });
    };

    service.getProject = function(param, callback) {
        // getting one project by id from the table
        console.log('getting project form database in indexed Service');
        dsDb.projects.where('id').equals(param.id).toArray(function (projects) {
              callback(projects);
        });
    };
}]);
