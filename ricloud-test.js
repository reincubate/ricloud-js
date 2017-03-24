var readlineSync = require('readline-sync');

var riCloud = require('./dist/ricloud');
var setting = require('./conf/settings.json');

var device;

if (!setting.icloud.apple_id) {
  setting.icloud.apple_id = readlineSync.question('\niCloud account(Email): ');
  setting.icloud.password = readlineSync.question('\niCloud Password: ', {
    hideEchoBack: true,
  });
}

var api = new riCloud(setting.auth.user, setting.auth.key, setting);

login();

function login(err, data) {
  if (err === api.error.GENERAL) {
    showError(data);
  }
  api.login(getData);
}

function getData(err, response) {
  if (err === api.error.GENERAL) {
    showError(response);
  }

  if (err === api.error.TWOFA_REQUIRED) {
    var index = readlineSync.keyInSelect(api.trustedDevices, '\n2FA has been enabled, choose a trusted device');
    if (index === -1) {
      process.exit(1);
    }
    console.log('Selected: ' + api.trustedDevices[index]);
    api.requestTwoFAChallenge(api.trustedDevices[index], promptForCode);
  } else {
    console.log('login result:', JSON.parse(response.body));
    console.log(`authToken: ${api.authToken}`);
    showDeviceInfo(null, null);
  }
}

function promptForCode(err, data) {
  if (err === api.error.GENERAL) {
    showError(data);
  }
  var code = readlineSync.question('\nA code has been sent to your device. Please enter code: ');
  // Submit the 2FA code, then go back to login()
  api.submitTwoFAChallenge(code, login);
}

function showDeviceInfo(err, data) {
  if (err === api.error.GENERAL) {
    showError(data);
  }
  device = Object.keys(api.devices)[0];
  var deviceInfo = api.devices[device];
  console.log(device, deviceInfo);

  var requested_data = api.data.INSTALLED_APPS | api.data.SMS;

  var toDownloadData = readlineSync.question(`\nDo you wan to download SMS? (y/N)`) || 'N';

  if (toDownloadData === 'y') {
    var since = new Date(2015, 0, 1);
    console.log('\nDownloading data...');
    api.requestData(device, requested_data, since, showData);
  }
}

function showData(err, data) {
  if (err) {
    showError(data);
  }

  console.log(data);

  downloadFile();
}

function downloadFile() {
  // Download a file
  console.log('\nDownloading sms.db...');
  api.downloadFile(device, '3d0d7e5fb2ce288813306e4d4636395e047a3d28', 'sms.db', function(err, data) {
    if (err) {
      showError(data);
    }

    console.log('\nDone');
  });
}

function showError(response) {
  console.log('Error: ' + response.statusCode + ' ' + response.statusMessage + ' ' + response.body);
  process.exit(1);
}
