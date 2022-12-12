const commandFactory = require('./commandFactory');

const borgCommandFactory = new commandFactory.BorgCommandFactory();


function checkRepository(repoLocation, repoPassphrase) {
  // Simply run `borg info` on the repository to see if it succeeds.
  return borgCommandFactory.CreateBorgInfoCommand(repoLocation, repoPassphrase).Run();
}

function parseBorgListOutput(output) {
  // TODO: Real implementation.
  const archiveList = output.split('\n');
  return archiveList;
}

function getRepositoryArchiveList(repoLocation, repoPassphrase) {
  // Get the command to run borg list.
  const command = borgCommandFactory.CreateBorgListCommand(repoLocation, repoPassphrase);

  // TODO: Add formatting arguments to the command.

  // Run the command, parse the output, return the structured output.
  return command.Run()
    .then(parseBorgListOutput);
}

module.exports = {
  checkRepository: checkRepository,
  getRepositoryArchiveList: getRepositoryArchiveList
};