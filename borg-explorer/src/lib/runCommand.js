const { exec } = require('child_process');

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
        BORG_PASSPHRASE: passphrase
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
