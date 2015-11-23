# ricloud: iCloud access made easy

This is a sample JavaScript Node.js module for interaction with Reincubate's iCloud API. The Reincubate iCloud API provides powerful programmatic iCloud access to investigators, application developers and integrators. It is RESTful and makes many commonly-accessed forms of data available as JSON feeds.

The API includes functionality for extraction, manipulation and recovery of many types of iOS data, and has functionality to support bulk, scheduled, and realtime data access. It fully supports iOS 9 CloudKit-based iCloud backups, and backups created with the new A9 chipsets.

## JSON feed vs raw file access

There are two core parts to the API: the JSON feed mechanism, and the raw file access mechanism. The JSON feeds come with a number of advantages:

 * Access to feed data is generally faster and scales better than raw file access
 * App data stored in databases and Plists is prone to change in format and location over time; the JSON feed abstracts away that complexity so that you needn't worry.
 * Users of the JSON feeds are able to take advantage of Reincubate's proprietary techniques in extracting app data, such that the resultant data is more accurate.

## Installation

The library can be installed with a single command:

```bash
$ npm install ricloud
```

### Configuration

The API relies on a set of security credentials, which are stored in an `conf/settings.json` file. This package ships with a default configuration file which enables limited access to the API for demonstration purposes. Full access can be gained by contacting [Reincubate](mailto:enterprise@reincubate.com).

Alternately these security credentials can be specified when calling the APIs (see below).

This file should have the following details:

```json
{
  "auth": {
    "user": "<reincubate user id>",
    "key": "<reincubate key>"
  },
  "icloud": {
    "apple_id": "<iCloud ID>",
    "password": "<iCloud password>"
  }
}
```

## Usage

A sample script is included which provides an example of how the API can be used to access a range of datatypes in a way that is compatible with Apple's 2FA mechanism. The sample script can be run like this:

```bash
$ node ricloud-test.js
```

### Authentication against the API and listing iCloud data

```javascript
var riCloud = require('ricloud.js')

api = new riCloud()
// or to specify user and key instead of using settings.json
// api = new Reincubate(user, key)

api.login(function(err, data) {
    console.log(api.devices)
})
// or specify Apple ID and password instead of using settings.json with:
// api.login(appleID, password, callback())
```


That `api.devices` dictionary contains data in this format:

```python
{'7c7fba66680ef796b916b067077cc246adacf01d': {
    'colour': '#e4e7e8',
    'device_name': "Renate's iPhone",
    'latest-backup': '2015-11-17 16:46:39.000000',
    'model': 'N71mAP',
    'name': 'iPhone 6s'},
 '8e281be6657d4523710d96341b6f86ba89b56df7': {
    'colour': '#e1e4e3',
    'device_name': "Renate's iPad",
    'latest-backup': '2015-11-13 19:35:52.000000',
    'model': 'J98aAP',
    'name': 'iPad Pro'},
}
```

### Using the JSON feed API

The API is able to return data retrieved from a wide range of apps, and enumerations for some of these are baked into the sample API. However, we have many other types of app feeds available, including Viber, Kik, WeChat, Line, and others.

> We also have functionality such as message undeletion which can be enabled on demand against API keys.

To choose which data types to return in the feed, users can pass a mask of data types to the `requestData` method. To select multiple data types, separate each type with the bitwise OR ``|`` operator. For example to select both SMS and photo data:

```javascript
# SMS and photo retrieval
var requested_data = api.data.SMS | api.data.PHOTOS
```

If no selection is made, the API will return all available data available. The following is an example of how to select which data to retrieve.

```javascript
var requested_data = api.data.SMS
var since = new Date(2015, 0, 1)
api.requestData(device, requested_data, since, function(err,data) {
    console.log(data)
})
```

## Troubleshooting

### The JSON feed returns a message: "Contact enterprise@reincubate.com for access to this data"

This message will be returned when the demonstration key is used. Please contact us for a trial key with access to more data. If you already have a trial key, are you correctly specifying it in your `~/.ricloud.ini` file? Note that the file has a period at the start.

### I'm trying to pull an app's database file by `file_id` but I'm not getting any data back

`file_id`s are derived from an SHA-1 hash of the file's path and name, so they are constant for any given file. If the file's attributes or content change, it won't affect the hash.

However, sometimes app authors change the name of the file they store data in (and sometimes Apple do in new iOS releases). That's why, for instance, there several different `file_id`s to examine when getting WhatsApp data. These `file_id`s could be changed any time an app is updated.

This is one of the reasons we recommend users pull our JSON feeds instead of working with files and manipulating them directly. Using the JSON feeds, one needn't worry over the efficacy of SQL, PList parsing or undeletion, and the JSON feeds are quicker and much simpler to work with.

## Need more functionality?

Reincubate builds world class iOS and app data access and recovery technology. The company was founded in 2008 and was first to market with iOS backup extraction technology, consumer backup decryption, and more recently with enterprise iCloud support. Clients include law enforcement, government and security organisations in the US and internationally, and to corporations as large as Microsoft and IBM.

> Users with simpler needs may wish to try the [iPhone Backup Extractor](http://www.iphonebackupextractor.com), which provides a set of iCloud functionality better suited to consumers.

With six years' experience helping police forces, law firms and forensics labs access iOS data, the company can help enterprise users with:

* iCloud access and data recovery
* Recovery of data deleted from SQLite databases
* Bulk iOS data recovery
* Forensic examination of iOS data
* Passcode, password and keybag analysis
* Custom iOS app data extraction
* Advanced PList, TypedStream and Mbdb manipulation

Contact [Reincubate](mailto:enterprise@reincubate.com) for more information, or see our site at [reincubate.com](https://www.reincubate.com).

## Terms & license

Users must not use the API in any way that is unlawful, illegal, fraudulent or harmful; or in connection with any unlawful, illegal, fraudulent or harmful purpose or activity. See the `LICENSE` file. Full terms are available from [Reincubate](mailto:enterprise@reincubate.com).

Copyright &copy; Reincubate Ltd, 2011 - 2015, all rights reserved.
