var _ = require('lodash');
var blessed = require('blessed');
var colors = require('colors');
var moment = require('moment');

var screen;
var tasksList;
var logBox;
var loadingBox;

function exit() {
    screen.destroy();
}

function start() {
    screen = blessed.screen({
        smartCSR: true,
        autoPadding: true
    });

    screen.key(['C-c'], function(ch, key) {
        exit();
    });

    var logText =
        colors.bgBlue.white.bold(' Enter/Space ')+' add time '+
        colors.bgBlue.white.bold(' B ') + ' open browser '+
        colors.bgBlue.white.bold(' Esc ') + ' close window';
    logBox = blessed.box({
        width: '100%',
        top: '100%-1',
        content: logText
    });
    screen.append(logBox);
    screen.render();
}

function startLoading() {
    loadingBox = blessed.loading({
        keys: true,
        top: 'center',
        left: 'center',
        width: '40%',
        height: '20%',
        padding : 1,
        border: {
            type: 'line',
        }
    });

    screen.append( loadingBox );
    screen.render();

    loadingBox.load( 'Processing' );
}

function stopLoading() {
    loadingBox.stop();
}

function listStyle() {
    return {
        selectedBg: 'blue',
        selectedFg: 'white',
        // mouse: true,
        keys: true,
        vi: true
    };
}

function makeTitleForTask(task) {
    var title = [
        '[',
        task.project.name,
        '] ',
        colors.blue( '#' + task.id ),
        ': ',
        colors.green( task.name )
    ];

    if ( task.labels.length ) {
        title.push( ' (' );

        title.push( _.map( task.labels, function ( label ) {
            return label.name;
        } ).join( ', ' ) );

        title.push( ')' );
    }


    return title.join( '' );
}

function showAnswers( tasks, callback) {
    var listBox = blessed.box({
        top: 'center',
        left: 'center',
        width: '90%',
        height: '90%',
        border: {
            type: 'line',
        },
        tags: true,
    });

    var listOptions = {
        parent: listBox,
        border: {
            type: 'bg',
        },
    };

    _.extend(listOptions, listStyle());
    tasksList = blessed.list(listOptions);

    tasksList.setItems(tasks.map(makeTitleForTask));

    tasksList.on('select', function() {
        callback(this.selected);
    });

    tasksList.key(['space', 'o'], function() {
        tasksList.enterSelected();
        screen.render();
    });

    tasksList.key(['b'], function(event) {
        var task = tasks[this.selected];
        require('openurl').open(process.env.AC_URL + task.url_path);
    });

    tasksList.key(['escape', 'q'], function() {
        screen.remove(listBox);
        screen.render();
        exit();
    });

    listBox.append(tasksList);
    tasksList.focus();
    screen.append(listBox);
    screen.render();
}

function showAnswer( task, jobTypes, onSubmit ) {
    var text = colors.green.underline( task.name );
    var form = blessed.form({
        keys: true,
        top: 'center',
        left: 'center',
        width: '80%',
        height: '80%',
        padding : 1,
        border: {
            type: 'line',
        },
        scrollbar: {
            border: {
                bg: 'yellow'
            },
            bg: 'yellow'
        },
        content: text
    });

    var input = blessed.textbox({
      parent: form,
      label: "Time",
      keys: true,
      shrink: true,
      inputOnFocus: true,
      border: { type: 'line', },
      padding: { left: 1, right: 1 },
      width: '40%',
      left: 0,
      top: 2,
      shrink: true,
      name: 'time',
      value: '',
      style: { focus: { bg: 'blue', fg: 'white' }, hover: { bg: 'blue', fg: 'white' } }
    });

    var date = blessed.textbox({
      parent: form,
      label: "Date",
      keys: true,
      shrink: true,
      inputOnFocus: true,
      border: { type: 'line', },
      padding: { left: 1, right: 1 },
      width: '40%',
      left: 0,
      top: 6,
      shrink: true,
      name: 'date',
      value: moment().format( "YYYY-MM-DD" ),
      style: { focus: { bg: 'blue', fg: 'white' }, hover: { bg: 'blue', fg: 'white' } }
    });

    var typeList = blessed.radioset({
        parent: form,
        label: "Type",
        keys: true,
        shrink: true,
        left: 0,
        top: 10,
    });

    var index = 0;
    _.forEach( jobTypes, function ( jobType ) {
        blessed.radiobutton({
            parent: typeList,
            label: jobType.name,
            left: 10,
            top: index,
            keys: true,
            shrink: true
        });

        index++;
    });

    var submit = blessed.button({
        parent: form,
        mouse: true,
        keys: true,
        shrink: true,
        padding: { left: 1, right: 1 },
        left: 0,
        top: 14 + index,
        shrink: true,
        name: 'submit',
        content: 'submit',
        style: { focus: { bg: 'blue', fg: 'white' }, hover: { bg: 'blue', fg: 'white' } },
        border: { type: 'line' }
    });

    submit.on('press', function() {
      form.submit();
    });

    form.key(['escape', 'q'], function() {
        screen.remove(form);
        screen.render();
    });

    form.on('submit', function(data) {
        onSubmit( data );
        screen.remove(form);
        screen.render();
    });

    screen.append(form);
    input.focus();
    screen.render();
}

function showMessage ( message ) {
    var messageBox = blessed.message({
        content: message,
        keys: true,
        top: 'center',
        left: 'center',
        width: '40%',
        height: '20%',
        padding : 1,
        border: {
            type: 'line',
        }
    });

    messageBox.key(['escape', 'q'], function() {
        screen.remove(messageBox);
        tasksList.focus();
        screen.render();
    });

    messageBox.focus();

    screen.append( messageBox );
    screen.render();
}

module.exports = {
    start: start,
    exit: exit,
    stop: function() {
        if(screen) {
            screen.destroy();
        }
    },
    showAnswers: showAnswers,
    showAnswer: showAnswer,
    showMessage: showMessage,
    startLoading: startLoading,
    stopLoading: stopLoading
};
