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

  CreateBorgListRepoCommand(repoLocation, passphrase) {
    return this.CreateBaseBorgCommand(passphrase)
      .WithArgs(['list', repoLocation])
  }

  CreateBorgListArchiveCommand(repoLocation, passphrase, archiveName) {
    return this.CreateBaseBorgCommand(passphrase)
      .WithArgs(['list', repoLocation + '::' + archiveName])
  }
}

const borgCommandFactory = new BorgCommandFactory();

function checkRepository(repoLocation, repoPassphrase) {
  // Simply run `borg info` on the repository to see if it succeeds.
  return borgCommandFactory.CreateBorgInfoCommand(repoLocation, repoPassphrase).Run();
}

function getRepositoryArchiveList(repoLocation, repoPassphrase) {
  // Run borg list for archive, format output as json
  const command = borgCommandFactory.CreateBorgListRepoCommand(repoLocation, repoPassphrase)
      .WithArg('--json');

  // Run the command, parse the output, return the structured output.
  return command.Run().then(JSON.parse);
}

function getArchiveFileList(repoLocation, repoPassphrase, archiveName, archivePath) {
  // Run borg list for archive, format output as json-lines
  const command = borgCommandFactory.CreateBorgListArchiveCommand(repoLocation, repoPassphrase, archiveName)
      .WithArg('--json-lines');
  
  // If a path was specified, filter output to only files in that path.
  if (archivePath != null) {
    // Regex: ^<path>[^/]*$
    // ^: Start of string
    // <path>: The path to filter by
    // [^/]*: Any number of characters that aren't a slash (filter out subdirectories)
    // $: End of string
    command.WithArgs(['--pattern', `re:^${archivePath}[^/]*$]`])
  }
  
  // Because the output isn't valid JSON, we can't use JSON.parse directly.
  // Instead, manually parse the output into a list of JSON objects.
  return command.Run().then((output) => {
    var lines = output.split('\n');
    lines = lines.filter((line) => line.length > 0);
    var jsonObjects = lines.map((line) => JSON.parse(line));
    return jsonObjects;
  });
}

module.exports = {
  checkRepository: checkRepository,
  getRepositoryArchiveList: getRepositoryArchiveList,
  getArchiveFileList: getArchiveFileList
};