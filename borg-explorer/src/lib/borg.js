const { Command, RESUME_PROCESS, KILL_PROCESS } = require('./command');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use one temp directory for all borg commands.
var tempDir = null;

// Define a BorgCommandFactory class that contains methods to
// create commands to run borg commands.
class BorgCommandFactory {
  GetBorgInstallationPaths() {
    return config.getConfigSetting('borg_installation_paths');
  }

  GetRemoteBorgPath() {
    return config.getConfigSetting('remote_borg_path');
  }

  CreateBaseBorgCommand(passphrase) {
    var cmd = new Command('borg')
      .WithArgs(['--remote-path', this.GetRemoteBorgPath()])
      .SetEnv({
        BORG_PASSPHRASE: passphrase,
        PATH: this.GetBorgInstallationPaths(),
      });

      if (config.getConfigSetting('ignore_moved_repository_warning')) {
        cmd.WithEnv('BORG_RELOCATED_REPO_ACCESS_IS_OK', 'yes');
      }

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

  CreateBorgListArchiveCommand(repoLocation, passphrase, archiveName, archivePath=null) {
    var command = this.CreateBaseBorgCommand(passphrase)
      .WithArgs(['list', repoLocation + '::' + archiveName])
    
    // If a path was specified, filter output to only files in that path.
    if (archivePath != null) {
      // Regex: ^<path>[^/]*$
      // ^: Start of string
      // <path>: The path to filter by
      // [^/]*: Any number of characters that aren't a slash (filter out subdirectories)
      // $: End of string
      command.WithArgs(['--pattern', `re:^${archivePath}[^/]*$]`])
    }

    return command;
  }

  CreateBorgExtractCommand(repoLocation, passphrase, archiveName, archivePath, destinationPath) {
    return this.CreateBaseBorgCommand(passphrase)
      .WithArgs([
        'extract', 
        repoLocation + '::' + archiveName,
        archivePath
      ])
      .InDir(destinationPath);
  }
}

const borgCommandFactory = new BorgCommandFactory();

function checkRepository(repoLocation, repoPassphrase) {
  // Simply run `borg info` on the repository to see if it succeeds.
  // Slight complication: Sometimes Borg outputs an error about a moved repository.
  // Need to use RunStream to see if a warning is printed to stdout. If so, reject the promise.
  return new Promise((resolve, reject) => {
    var command = borgCommandFactory.CreateBorgInfoCommand(repoLocation, repoPassphrase);

    var onData = (data) => {
      
    }

    var onEnd = () => {
      resolve();
    }

    var onError = (err) => {
      // If the data contains a message about the repository being moved, raise an error.
      const movedMessageNeedle = 'Warning: The repository at location';
      if (err.includes(movedMessageNeedle)) {
        // If the message also includes the fact that the user has configured the app to ignore this warning, ignore it.
        const moveApprovedNeedle = 'BORG_RELOCATED_REPO_ACCESS_IS_OK';
        if (err.includes(moveApprovedNeedle)) {
          return RESUME_PROCESS; // Ignore the error
        }
        // Otherwise, reject the promise.
        reject(err);
        return KILL_PROCESS;
      }
      else {
        // Unknown stderr output, display it.
        reject(err);
        return KILL_PROCESS;
      }
    }

    command.RunStream(onData, onEnd, onError)
      .catch(onError);
  });
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
  const command = borgCommandFactory.CreateBorgListArchiveCommand(repoLocation, repoPassphrase, archiveName, archivePath)
      .WithArg('--json-lines');

  // Because the output isn't valid JSON, we can't use JSON.parse directly.
  // Instead, manually parse the output into a list of JSON objects.
  return command.Run().then((output) => {
    var lines = output.split('\n');
    lines = lines.filter((line) => line.length > 0);
    var jsonObjects = lines.map((line) => JSON.parse(line));
    return jsonObjects;
  });
}

function getArchiveFileListStream(repoLocation, repoPassphrase, archiveName, archivePath, onOutput, onEnd) {
  const command = borgCommandFactory.CreateBorgListArchiveCommand(repoLocation, repoPassphrase, archiveName, archivePath)
      .WithArg('--json-lines');

  onError = (err) => {
    // On stderr do nothing, just fail out.
    onEnd();
    return KILL_PROCESS;
  }

  return command.RunStream((line) => {
    if (line.length > 0) {
      onOutput(JSON.parse(line));
    }
  }, onEnd, onError);
}

function extractTempFile(repoLocation, repoPassphrase, archiveName, archivePath) {
  ensureTempDirectoryExists();

  // Extract a file to the temporary directory.
  var destinationPath = tempDir + '/' + archivePath;

  // If the file already exists, delete it
  if (fs.existsSync(destinationPath)) {
    fs.unlinkSync(destinationPath);
  }

  return borgCommandFactory.CreateBorgExtractCommand(repoLocation, repoPassphrase, archiveName, archivePath, tempDir).Run()
    .then(() => destinationPath); // Return the path to the extracted file.
}

function ensureTempDirectoryExists() {
  if (tempDir == null) {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'borg-explorer-'));
    console.log('Created temp directory: ' + tempDir);
  }
}

function cleanTempDirectory() {
  // Delete the temporary directory.
  if (tempDir != null) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
}

function extract(repoLocation, repoPassphrase, archiveName, archivePath, destinationPath) {
  return borgCommandFactory.CreateBorgExtractCommand(repoLocation, repoPassphrase, archiveName, archivePath, destinationPath).Run()
  .then(() => destinationPath); // Return the path to the extracted file(s).
}

function getTempDirectory() {
  return tempDir;
}

module.exports = {
  checkRepository: checkRepository,
  getRepositoryArchiveList: getRepositoryArchiveList,
  getArchiveFileList: getArchiveFileList,
  getArchiveFileListStream: getArchiveFileListStream,
  extractTempFile: extractTempFile,
  cleanTempDirectory: cleanTempDirectory,
  getTempDirectory: getTempDirectory,
  extract: extract,
};