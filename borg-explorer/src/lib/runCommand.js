const { exec } = require('child_process');

const defaultBorgInstallationPathLinux = '/usr/local/bin/'
const defaultBorgInstallationPathMac = '/opt/homebrew/bin/'
const defaultPathEnvVar = `${defaultBorgInstallationPathLinux}:${defaultBorgInstallationPathMac}`

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

module.exports = {
  runCommand: runCommand,
  runBorgInfo: runBorgInfo,
};
