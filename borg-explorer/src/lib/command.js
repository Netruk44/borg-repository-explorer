const { exec, spawn } = require('child_process');
const { ipcMain } = require('electron');
const process = require('process');

const RESUME_PROCESS = 0;
const KILL_PROCESS = 1;

// A class for running commands by easily building up a command string.
// Build the command with the methods, then call Run() to execute the
// command, which returns a Promise that resolves with the output of the
// command when it completes. Use RunStream() to get the output as it
// happens.
class Command {
  // Note: Changes are done in-place, not by returning a new object.

  constructor(command = '', args = [], env = {}, cwd = null) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.cwd = cwd;
  }

  // Set the command to run.
  SetCommand(command) {
    this.command = command;
    return this;
  }

  // Set the environment variables to run the command with.
  SetEnv(env) {
    this.env = env;
    return this;
  }

  // Add an environment variable to run the command with.
  WithEnv(key, value) {
    this.env[key] = value;
    return this;
  }

  // Set the arguments to pass to the command.
  SetArgs(args) {
    this.args = args;
    return this;
  }

  // Add an argument to pass to the command.
  WithArg(arg) {
    this.args.push(arg);
    return this;
  }

  // Add multiple arguments to pass to the command.
  WithArgs(args) {
    this.args = this.args.concat(args);
    return this;
  }

  // Run the command in a specific directory.
  InDir(dir) {
    this.cwd = dir;
    return this;
  }

  // Get the current working directory.
  GetCwd() {
    if (this.cwd == null) {
      return process.cwd();
    }
    return this.cwd;
  }

  // Run the command.
  Run() {
    // Can't access 'this' inside Promise
    const parent = this;

    return new Promise(function (resolve, reject) {
      // Make a copy of args
      const args = parent.args.slice();

      // Add quotes to each argument if it contains special characters.
      // (space, vertical bar, ampersand)
      let requiresQuotes = /[\s|&]/;
      for (let i = 0; i < args.length; i++) {
        if (requiresQuotes.test(args[i])) {
          args[i] = `"${args[i]}"`;
        }
      }

      // Join the command and arguments into a single string.
      const fullCommand = `${parent.command} ${args.join(' ')}`;

      const options = {
        cwd: parent.GetCwd(),
        env: parent.env,
      }

      exec(fullCommand, options, function (error, stdout, stderr) {
        if (error) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  // onData is called once per line of output.
  // onEnd is called when the command finishes.
  // onError is called when stderr is written to. Should return KILL_PROCESS to kill the process, or RESUME_PROCESS to continue.
  RunStream(onData, onEnd, onError) {
    // Can't access 'this' inside Promise
    const parent = this;

    return new Promise(function (resolve, reject) {
      const options = {
        cwd: parent.GetCwd(),
        env: parent.env
      }

      const child = spawn(parent.command, parent.args, options);
      
      var lineBuffer = '';
      child.stdout.on('data', (data) => {
        var lines = (lineBuffer + data).split('\n');

        // If the last line doesn't end with a newline, then it's
        // not a complete line, so we'll save it for later.
        if (data[data.length - 1] != '\n') {
          lineBuffer = lines.pop();
        } else {
          lineBuffer = '';
        }

        lines.forEach((line) => {
          onData(line);
        });
      });

      child.stdout.on('end', () => {
        // If there's anything left in the buffer, then it's
        // a complete line, so we'll send it.
        if (lineBuffer.length > 0) {
          onData(lineBuffer);
        }

        onEnd();
        resolve();
      });

      child.stderr.on('data', (data) => {
        const strData = '' + data; // Convert to string
        if (onError(strData) == KILL_PROCESS) {
          child.kill();
          reject();
        }
      });
    });
  }
}

module.exports = {
  Command: Command,
  RESUME_PROCESS: RESUME_PROCESS,
  KILL_PROCESS: KILL_PROCESS,
};