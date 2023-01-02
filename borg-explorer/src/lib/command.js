const { exec, spawn } = require('child_process');
const { ipcMain } = require('electron');
const process = require('process');

// Define a Command class that contains a string command to run,
// environment variables to run the command with, and a list of
// arguments to pass to the command. Command will follow a builder
// pattern, where the user can chain methods to set everything,
// followed by a call to .Run() to execute the command.
class Command {
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

      // Add quotes to each argument if it contains spaces.
      for (let i = 0; i < args.length; i++) {
        if (args[i].includes(' ')) {
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
  RunStream(onData, onEnd) {
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
        reject('' + data); // Convert to string
      });
    });
  }
}

module.exports = {
  Command: Command
};