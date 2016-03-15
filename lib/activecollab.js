'use strict';

var request = require('request');

var ActiveCollab = function (url, username, password, client, vendor) {
    this.version = 1;
    this.url = url;
    this.username = username;
    this.password = password;
    this.client = client;
    this.vendor = vendor;
    this.token = null;
    this.userId = null;
};

ActiveCollab.prototype.prepareUrl = function (url) {
    return this.url + '/api/v' + this.version + '/' + url;
};

ActiveCollab.prototype.issueToken = function ( callback ) {
    var that = this;

    var data = {
        form: {
            'username': this.username,
            'password': this.password,
            'client_name': this.client,
            'client_vendor': this.vendor,
        }
    };

    request.post(this.prepareUrl('issue-token'), data, function ( error, response ) {
        if (response.statusCode == 200) {
            var body = JSON.parse( response.body );
            that.token = body.token;
            that.userId = that.token.split( '-' )[ 0 ];
            callback();
        } else {
            new Error( "Token not issued" );
        }
    });
};

ActiveCollab.prototype.prepareHeaders = function () {
    return {
        'Content-type': 'application/json',
        'X-Angie-AuthApiToken': this.token
    };
};

ActiveCollab.prototype.get = function ( url, callback ) {
    var options = {
        url: this.prepareUrl( url ),
        headers: this.prepareHeaders()
    };

    request.get( options, function ( error, response, body ) {
        if (response.statusCode == 200) {
            callback( JSON.parse( body ) );
        } else {
            throw new Error( "Something went wrong: " + response.statusCode, error );
        }
    } );
};

ActiveCollab.prototype.put = function ( url, payload, callback ) {
    var options = {
        url: this.prepareUrl( url ),
        headers: this.prepareHeaders(),
        form: payload
    };

    request.post( options, function ( error, response, body ) {
        if ( callback ) {
            callback( error, response, body );
        }
    } );
};

module.exports = ActiveCollab;
