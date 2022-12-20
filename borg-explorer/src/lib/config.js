const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const default_config = {
  // TODO: Specify the default configuration here.
}

var config = null;

function getConfig() {
  if (config == null) {
    readConfig();
  }
  return config;
}

function setConfig(newConfig) {
  Object.assign(config, newConfig);
  writeConfig();
}

function readConfig() {
  const configDir = app.getPath('userData');
  const configPath = path.join(configDir, 'config.json');
  try {
    config = JSON.parse(fs.readFileSync(configPath));
  } catch (err) {
    console.log('Error reading config file: ' + err);
    
    // If the config file doesn't exist, create it with the default
    // configuration.
    if (err.code === 'ENOENT') {
      config = default_config;
      writeConfig();
    } else {
      throw err;
    }
  }
}

function validateConfig() {
  // Make changes to the config if necessary.

  // If the config is missing entries the default config has, add them.
  Object.keys(default_config).forEach(key => {
    if (!(key in config)) {
      config[key] = default_config[key];
    }
  });
}

function writeConfig() {
  const configDir = app.getPath('userData');
  const configPath = path.join(configDir, 'config.json');

  validateConfig();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  getConfig: getConfig,
  setConfig: setConfig,
};