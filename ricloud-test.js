var readlineSync = require('readline-sync');

var riCloud = require('./dist/ricloud');
var setting = require('./conf/settings.json');

const LOGIN_BY_ICLOUD_PASSWORD = '1';
const LOGIN_BY_AUTH_TOKEN = '2';
const LOGIN_BY_SESSION_KEY = '3';

var device;

if (!setting.icloud.apple_id) {
  setting.icloud.apple_id = readlineSync.question('\niCloud account(Email): ');
}

var authTask = readlineSync.question(`
  Which way do you want to use for login: (default: ${LOGIN_BY_ICLOUD_PASSWORD})
  1) iCloud password
  2) auth token
  3) session key
`) || LOGIN_BY_ICLOUD_PASSWORD;

var api = createApi(authTask);

login();

function createApi(authTask) {
  let api;

  if (authTask === LOGIN_BY_ICLOUD_PASSWORD) {
    if (!setting.icloud.password) {
      setting.icloud.password = readlineSync.question('\niCloud Password: ', {
        hideEchoBack: true,
      });
    }
  }

  api = new riCloud(setting.auth.user, setting.auth.key, setting);

  if (authTask === LOGIN_BY_AUTH_TOKEN) {
    api.authToken = readlineSync.question('\nauth token: ');
  } else if (authTask === LOGIN_BY_SESSION_KEY) {
    api.sessionKey = readlineSync.question('\nsession key: ');
  }

  return api;
}

function login(err, data) {
  if (err) {
    showError(data);
  }

  if (authTask === LOGIN_BY_AUTH_TOKEN) {
    api.refreshSession(() => {
      login(api.devices);
      runTask();
    });
  } else if (authTask === LOGIN_BY_SESSION_KEY) {
    runTask();
  } else {
    api.login(handleLogin);
  }
}

function handleLogin(err, response) {
  if (err === api.error.GENERAL) {
    showError(response);
  } else if (err === api.error.TWOFA_REQUIRED) {
    var index = readlineSync.keyInSelect(api.trustedDevices, '\n2FA has been enabled, choose a trusted device');
    if (index === -1) {
      process.exit(1);
    }
    console.log('Selected: ' + api.trustedDevices[index]);
    api.requestTwoFAChallenge(api.trustedDevices[index], promptForCode);
  } else {
    console.log('login result:', JSON.parse(response.body));
    console.log(`authToken: ${api.authToken}`);
    runTask();
  }
}

function runTask() {
  var task = readlineSync.question(`
    \nChoose a task to run: (default: 1)
    \n1) show device info
  `) || '1';

  switch (task) {
    case '1':
      if (!api.devices) {
        let deviceCode = readlineSync.question('\nDevice code: ');
        let deviceObj = {};

        deviceObj[deviceCode] = {};

        api.devices = [deviceObj];
      }
      showDeviceInfo(null, null);
      break;
    default:
      break;
  }
}

function promptForCode(err, data) {
  if (err) {
    showError(data);
  }
  var code = readlineSync.question('\nA code has been sent to your device. Please enter code: ');
  // Submit the 2FA code, then go back to login()
  api.submitTwoFAChallenge(code, login);
}

function showDeviceInfo(err, data) {
  if (err) {
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
