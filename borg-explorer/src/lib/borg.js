const runCommand = require('./runCommand');

function getRepositoryArchiveList(repoLocation, repoPassphrase) {
  runCommand.runBorgList_Repository(repoLocation, repoPassphrase)
    .then(output => {
      // TODO.
    });
}