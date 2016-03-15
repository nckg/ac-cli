/**
 * Require configuration from our dotenv files
 */
require('dotenv').config();
var _ = require('lodash');
var colors = require('colors/safe');
var ActiveCollab = require('./lib/activecollab');
var spinner = require('simple-spinner');
var spinnerOptions = { doNotBlock: true };
var ui = require('./lib/ui');

var apiUrl = process.env.API_URL;
var apiKey = process.env.API_KEY;

var ac = new ActiveCollab(
    process.env.AC_URL, process.env.AC_USERNAME,
    process.env.AC_PASSWORD,
    process.env.AC_CLIENT_NAME,
    process.env.AC_VENDOR
);

spinner.start(spinnerOptions);

ac.issueToken( function() {
    var jobTypes;
    ac.get( 'job-types', function ( values ) {
        jobTypes = values;
    } );
    ac.get( 'users/' + ac.userId + '/tasks', function ( values ) {
        var projects = values.related.Project;
        var tasks = _.sortBy(values.tasks.map(function (task) {
                var project = _.find( projects, function (project) {
                    return project.id == task.project_id;
                });

                task.project = project;
                return task;
            }), function (o) {
                return o.project.name;
        });

        spinner.stop();

        ui.start();
        ui.showAnswers( tasks, showTimeForm );
        function showTimeForm( index ) {
            var selected = tasks[ index ];
            ui.showAnswer(selected, jobTypes, addTime );

            function addTime( data ) {
                var url = "projects/" + selected.project_id + "/time-records";
                var payload = {
                    "task_id": selected.id,
                    "job_type_id": jobTypes[ _.findIndex( data.time, function (o) { return o; }) ].id,
                    "value": data.time,
                    "user_id": ac.userId,
                    "record_date": data.date
                };

                ui.startLoading();
                ac.put( url, payload, function ( error, response, body ) {
                    ui.stopLoading();

                    if (response.statusCode == 200) {
                        ui.showMessage( colors.green( "Success! Timerecord added to '" + colors.bold(selected.name) + "'" ) );
                    } else {
                        ui.showMessage( "Something went wrong..." );
                    }
                } );
            };
        }
    } );
});
