const { exec } = require('child_process');
const { ipcMain } = require('electron');

// Define a Command class that contains a string command to run,
// environment variables to run the command with, and a list of
// arguments to pass to the command. Command will follow a builder
// pattern, where the user can chain methods to set everything,
// followed by a call to .Run() to execute the command.
class Command {
  constructor(command = '', args = [], env = {}) {
    this.command = command;
    this.args = args;
    this.env = env;
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
        env: parent.env
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
}

module.exports = {
  Command: Command
};