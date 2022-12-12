const { exec } = require('child_process');

const defaultBorgInstallationPaths = [
  '/usr/bin/',          // Linux
  '/usr/local/bin/',    // Linux alternate
  '/opt/homebrew/bin/', // MacOS
];
const defaultPathEnvVar = defaultBorgInstallationPaths.join(':')

function runCommand(command) {
  return new Promise(function (resolve, reject) {
    exec(command, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function runBorgInfo(repoLocation, passphrase) {
  return new Promise(function (resolve, reject) {
    const options = {
      env: {
        BORG_PASSPHRASE: passphrase,
        PATH: defaultPathEnvVar
      }
    };
    exec(`borg info ${repoLocation}`, options, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function runBorgList_Repository(repoLocation, passphrase) {
  return new Promise(function (resolve, reject) {
    const options = {
      env: {
        BORG_PASSPHRASE: passphrase,
        PATH: defaultPathEnvVar
      }
    };
    exec(`borg list ${repoLocation}`, options, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = {
  runCommand: runCommand,
  runBorgInfo: runBorgInfo,
  runBorgList_Repository: runBorgList_Repository,
};
