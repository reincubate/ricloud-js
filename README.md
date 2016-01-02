# ricloud: iCloud access made easy

This is the sample JavaScript Node.js client for Reincubate's [iCloud API](https://www.reincubate.com/labs/icloud-api/?utm_source=github&utm_medium=ricloud-js&utm_campaign=ricloud).

> Refer to the comprehensive [iCloud API documentation](https://www.reincubate.com/contact/support/icloud-api/?utm_source=github&utm_medium=ricloud-js&utm_campaign=ricloud) for a fuller picture of the API's capabilities, specifications, and benefits.

## Installation

The library can be installed with a single command:

```bash
$ npm install ricloud
```

### Configuration

The API relies on a set of security credentials, which are stored in an `conf/settings.json` file. This package ships with a default configuration file which enables limited access to the API for demonstration purposes.

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


## Troubleshooting

See the iCloud API [support page](https://www.reincubate.com/contact/support/icloud-api/?utm_source=github&utm_medium=ricloud-js&utm_campaign=ricloud).

## <a name="more"></a>Need more functionality?

Reincubate's vision is to provide data access, extraction and recovery technology for all app platforms, be they mobile, desktop, web, appliance or in-vehicle.

The company was founded in 2008 and was first to market with both iOS and iCloud data extraction technology. With over half a decade's experience helping law enforcement and security organisations access iOS data, Reincubate has licensed software to government, child protection and corporate clients around the world.

The company can help users with:

* iCloud access and data recovery
* Recovery of data deleted from SQLite databases
* Bulk iOS data recovery
* Forensic examination of iOS data
* Passcode, password, keybag and keychain analysis
* Custom iOS app data extraction
* Advanced PList, TypedStream and Mbdb manipulation

Contact [Reincubate](https://www.reincubate.com/?utm_source=github&utm_medium=ricloud-js&utm_campaign=ricloud) for more information.

## Terms & license

See the `LICENSE.md` file for details on this implentation's license. Users must not use the API in any way that is unlawful, illegal, fraudulent or harmful; or in connection with any unlawful, illegal, fraudulent or harmful purpose or activity.
