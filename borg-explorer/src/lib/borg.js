const { Command } = require('./command');

// Define a BorgCommandFactory class that contains methods to
// create commands to run borg commands.
class BorgCommandFactory {
  constructor() {
    this.defaultBorgInstallationPaths = [
      '/usr/bin/',          // Linux
      '/usr/local/bin/',    // Linux alternate
      '/opt/homebrew/bin/', // MacOS
    ];
    this.defaultPathEnvVar = this.defaultBorgInstallationPaths.join(':');
  }

  // Create a command to run borg info.
  CreateBorgInfoCommand(repoLocation, passphrase) {
    return new Command()
      .SetCommand('borg')
      .WithArgs(['info', repoLocation])
      .SetEnv({
        BORG_PASSPHRASE: passphrase,
        PATH: this.defaultPathEnvVar
      });
  }

  // Create a command to run borg list.
  CreateBorgListCommand(repoLocation, passphrase) {
    return new Command()
      .SetCommand('borg')
      .WithArgs(['list', repoLocation])
      .SetEnv({
        BORG_PASSPHRASE: passphrase,
        PATH: this.defaultPathEnvVar
      });
  }
}

const borgCommandFactory = new BorgCommandFactory();

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