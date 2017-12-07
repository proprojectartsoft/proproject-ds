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
          //
            // schemaBuilder = lf.schema.create('DS', 24);
            schemaBuilder = new Dexie('DS');
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
          //
            // schemaBuilder.createTable('projects')
            //     .addColumn('id', lf.Type.INTEGER)
            //     .addColumn('value', lf.Type.STRING)
            //     .addPrimaryKey(['id'])
            //     .addIndex('idxValue', ['value'], false, lf.Order.ASC);
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
      //
        var params = e.data,
            operation = e.operation;

        if (!connectionReady) {
            // Start of the Promise chaining
            // connectionReady = schemaBuilder.connect({
            //     "onUpgrade": null,
            //     "storeType": lf.schema.DataStoreType.INDEXED_DB
            // });
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
                    // dsDb.delete().from(projects).exec()
                    //     .then(function() {
                    //         callback({
                    //             results: 0,
                    //             finished: true
                    //         });
                    //     });
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
      //
        // var insertData = function(data) {
        //         // now try to insert
        //         try {
        //             // insert or update the db
        //             dsDb.projects.update()
        //                 .into(projects)
        //                 .values(data)
        //                 .exec()
        //                 .then(
        //                     function(resp) {
        //                         callback(resp);
        //                     });
        //         } catch (e) {
        //             console.log('Error :', e);
        //             callback(false);
        //         }
        //     },
            parseData = function(data) {
                var dt = [],
                    object = false;
                for (var i = 0; i < data.length; i++) {
                    // create lovefield row type
                    // object = projects.createRow({
                    //     'id': data[i].id,
                    //     'value': data[i].value
                    // });
                    console.log('Thissss', data[i]);
                    dt.push(data[i]);
                }
              if (dt.length > 1) {
                  dsDb.projects.bulkAdd(dt).then(function (lastKey){
                    console.log('The last id inserted was: ', lastKey);
                    callback(lastKey);
                  }).catch(Dexie.bulkError, function(e) {
                    console.log('Error inserting in dexie: ', e);
                    callback(false);
                  });
              } else {
                dsDb.projects.update(dt[0].id, dt[0]).then(function (updated){
                  console.log('Updated element: ', updated);
                  callback(updated);
                }).catch(Dexie.bulkError, function(e) {
                  console.log('Error updating dexie: ', e);
                  callback(false);
                });
              }
                // insertData(dt);
            };
        parseData(data);
    };

    service.getProjects = function(callback) {
      //
        // dsDb
        //     .from(projects)
        //     .exec()
        //     .then(
        //         function(res) {
        //             callback(res);
        //         });
        dsDb.projects.where('id').between(0, 100000).toArray(function (projects) {
              callback(projects);
        });
    };

    service.getProject = function(param, callback) {
      //
        // dsDb
        //     .from(projects)
        //     .where(projects.id.eq(param.id))
        //     .exec()
        //     .then(
        //         function(res) {
        //             callback(res);
        //         });
        dsDb.projects.where('id').equals(param.id).toArray(function (projects) {
              callback(projects);
        });
    };
}]);
