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
    this.borgPath = 'borg';
  }

  SetRemoteBorgPath(path) {
    this.borgPath = path;
  }

  CreateBaseBorgCommand(passphrase) {
    var cmd = new Command('borg')
      .WithArgs(['--remote-path', this.borgPath])
      .SetEnv({
        BORG_PASSPHRASE: passphrase,
        PATH: this.defaultPathEnvVar
      });

      return cmd;
  }

  CreateBorgInfoCommand(repoLocation, passphrase) {
    return this.CreateBaseBorgCommand(passphrase)
      .WithArgs(['info', repoLocation]);
  }

  CreateBorgListCommand(repoLocation, passphrase) {
    return this.CreateBaseBorgCommand(passphrase)
      .WithArgs(['list', repoLocation])
  }
}

const borgCommandFactory = new BorgCommandFactory();

function checkRepository(repoLocation, repoPassphrase) {
  // Simply run `borg info` on the repository to see if it succeeds.
  return borgCommandFactory.CreateBorgInfoCommand(repoLocation, repoPassphrase).Run();
}

function getRepositoryArchiveList(repoLocation, repoPassphrase) {
  // Run borg list for archive, format output as json
  const command = borgCommandFactory.CreateBorgListCommand(repoLocation, repoPassphrase)
      .WithArg('--json');

  // Run the command, parse the output, return the structured output.
  return command.Run().then(JSON.parse);
}

module.exports = {
  checkRepository: checkRepository,
  getRepositoryArchiveList: getRepositoryArchiveList
};