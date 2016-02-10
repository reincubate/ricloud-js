'use strict'
var request = require('request')
var moment = require('moment')
var fs = require('fs');

// endpoints
var ENDPOINTS = {
    'login': "/c/sign-in/",
    'challenge_2fa': "/c/perform-2fa-challenge/",
    'submit_2fa': "/c/submit-2fa-challenge/",
    'download_data': "/c/download-data/",
    'download_file': "/c/download-file/"
}

var HOST = 'https://api.icloudextractor.com'
var API_VER = 1


/**
 * Callback format used by all async functions
 *
 * @callback callback
 * @param {number} err - The error (from the error enum)
 * @param {*} data
 */

/**
 * Primary object for dealing with the API. Used to initialize our client API instance.
 * @param [user] {string|null} riCloud User ID to authenticate against
 * @param [key] {string|null} Corresponding authentication key supplied by Reincubate
 * @constructor
 */
var riCloud = function (user, key, settings) {
    // Attempt to get settings from file

    user = user ? user : settings.auth.user
    key = key ? key : settings.auth.key
    HOST = settings ?
      settings.endpoints ?
        (settings.endpoints.host ? settings.endpoints.host : HOST) : HOST
      : HOST
    API_VER = settings ?
      settings.api_version ?
        settings.api_version : API_VER
      : API_VER

    this.auth = {
        user: user,
        pass: key
    }

    this.data = {
        SMS: 1,
        PHOTOS: 2,
        BROWSER_HISTORY: 4,
        CALL_HISTORY: 8,
        CONTACTS: 16,
        INSTALLED_APPS: 32,
        WEB_CONTACTS: 64,
        WEB_LOCATION: 256,
        WHATSAPP_MESSAGES: 512,
        SKYPE_MESSAGES: 1024
    }

    this.error = {
        GENERAL: 1,
        TWOFA_REQUIRED: 2
    }

    this.appleID = settings ? settings.icloud.apple_id ? settings.icloud.apple_id : null : null
    this.password = settings ? settings.icloud.password ? settings.icloud.password : null : null
};



/**
 * Log into iCloud
 * @param [appleID] {string|null} User's Apple ID
 * @param [password] {string|null} User's Apple password
 * @param cb {callback} Callback
 */
riCloud.prototype.login = function (appleID, password, cb) {
    var newArgs = argsWithFn(arguments, ['appleID', 'password', 'cb']);
    appleID = newArgs.appleID
    password = newArgs.password
    cb = newArgs.cb

    appleID = appleID ? appleID : this.appleID
    password = password ? password : this.password

    var data = {
        email: appleID,
        password: password
    }

    if (this.sessionKey) {
        data.key = this.sessionKey
    }

    var options = generateOptions(this, 'login', data)

    function callback(error, response, body) {
        var data
        if (!error && response.statusCode == 409) {
            data = JSON.parse(body)
            if (data.error == '2fa-required') {
                context.sessionKey = data.data.key
                context.trustedDevices = data.data.trustedDevices
                cb(context.error.TWOFA_REQUIRED, null)
            }
        } else if (!error && response.statusCode == 200) {
            data = JSON.parse(body)
            context.sessionKey = data.key
            context.devices = data.devices
            cb(0, null)
        } else {
            cb(error, response)
        }
    }

    var context = this;
    request(options, callback)
}


/**
 * Pull data from iCloud from a given point in time.
 * @param device {string}  Device ID to pull data for
 * @param [requestedData] {number|null} Bit mask representing what data to download
 * @param [sinceDate] {Object|null} Date to retrieve data from (i.e. SMS received after this point)
 * @param cb {callback} Callback
 */
riCloud.prototype.requestData = function(device, requestedData, sinceDate, cb) {
    console.assert(this.sessionKey, 'Session key is required, please log in.')
    var newArgs = argsWithFn(arguments, ['device', 'requestedData', 'sinceDate', 'cb']);
    device = newArgs.device
    console.assert(device, 'device is a required argument')
    requestedData = newArgs.requestedData
    sinceDate = newArgs.sinceDate
    cb = newArgs.cb

    if (!requestedData) {
        // No mask has been set, so use everything
        requestedData = 0
        for (var key in this.data) {
            if (this.data.hasOwnProperty(key)) {
                requestedData |= this.data[key]
            }
        }
    }

    if (sinceDate == null) {
        sinceDate = new Date(1900, 0, 1)
    }

    var since = moment(sinceDate).format('YYYY-MM-DD HH:mm:ss.SSS')

    var data = {
        key: this.sessionKey,
        mask: requestedData,
        since: since,
        device: device
    }
    var options = generateOptions(this, 'download_data', data)

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body)
            cb(0, data)
        } else {
            cb(context.error.GENERAL, response)
        }
    }

    var context = this;
    request(options, callback)
}


/**
 * Download an individual file from the iCloud backup
 * @param device {string}  Device ID to pull data for
 * @param fileID {string} File ID representing the file we want to download
 * @param [out] {string|null} Filename to write response to. If not provided we will return the object with in callback.
 * @param cb {callback} Callback
 */
riCloud.prototype.downloadFile = function(device, fileID, out, cb) {
    var newArgs = argsWithFn(arguments, ['device', 'fileID', 'out', 'cb']);
    device = newArgs.device
    console.assert(device, 'device is a required argument')
    fileID = newArgs.fileID
    console.assert(fileID, 'fileID is a required argument')
    out = newArgs.out
    cb = newArgs.cb

    var data = {
        key: this.sessionKey,
        device: device,
        file: fileID
    }
    var options = generateOptions(this, 'download_file', data)

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            // If out is null, return the data as the result. Otherwise return null
            var result = out ? null : body
            cb(0, result)
        } else {
            cb(context.error.GENERAL, response)
        }
    }
    var context = this;
    if (out) {
        request(options, callback).pipe(fs.createWriteStream(out))
    } else {
        request(options, callback)
    }
}


/**
 * Request a 2FA challenge to the supplied trusted device
 * @param challengeDevice {string} The device that will display the challenge code
 * @param cb {callback} Callback
 */
riCloud.prototype.requestTwoFAChallenge = function(challengeDevice, cb) {
    var data = {
        challenge: challengeDevice,
        key: this.sessionKey
    }
    var options = generateOptions(this, 'challenge_2fa', data)

    function callback(error, response, data) {
        if (!error && response.statusCode == 200) {
            // The challenge has been processed, we now need to wait
            // for the user's submission
            cb(0, null)
        } else {
            cb(context.error.GENERAL, response)
        }
    }

    var context = this;
    request(options, callback)
}


/**
 * Submit a user supplied 2FA challenge code
 * @param code {string} The code to supply
 * @param cb {callback} Callback
 */
riCloud.prototype.submitTwoFAChallenge = function(code, cb) {
    var data = {
        code: code,
        key: this.sessionKey
    }
    var options = generateOptions(this, 'submit_2fa', data)

    function callback(error, response, data) {
        if (!error && response.statusCode == 200) {
            // Worked. Now user needs to log in again.
            cb(0, null)
        } else {
            cb(context.error.GENERAL, response)
        }
    }

    var context = this;
    request(options, callback)
}


// Shared private functions

function argsWithFn(args, names) {
    /**
     * Helper function to provide optional parameters
     */
    var newArgs = {};
    var found = false;

    // Loop through the arguments, starting from the end, and
    // find the function.
    for (var i = args.length - 1; i >= 0; --i) {

        // If we find the function, put it in its expected place
        // at the end of the arguments list.
        if (!found && typeof args[i] == 'function') {
            var fn = args[i];
            newArgs[names[i]] = undefined;
            newArgs[names[names.length - 1]] = fn;
            found = true;
        }

        // Otherwise, just store the value in the new arguments.
        else {
            newArgs[names[i]] = args[i];
        }
    }
    return newArgs;
}


function getEndpoint(endpointName) {
    return HOST + ENDPOINTS[endpointName]
}


function generateOptions(context, endpoint, data) {
    return {
        url: getEndpoint(endpoint),
        headers: {
            'Accept': 'application/vnd.icloud-api.v' + API_VER
          },
        method: 'POST',
        auth: context.auth,
        form: data
    }
}


module.exports = riCloud
