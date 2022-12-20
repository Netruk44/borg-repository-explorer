const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const default_config = {
  // Default configuration settings
  borg_installation_paths: '/usr/bin:/usr/local/bin:/opt/homebrew/bin',
  remote_borg_path: 'borg',
  last_opened_repository: '',
}

var config = null;

function getConfig() {
  if (config == null) {
    readConfig();
    validateConfig(); // New versions may need to change the config.
  }
  return config;
}

function getConfigSetting(key) {
  return getConfig()[key];
}

function setConfig(newConfig) {
  // Overwrite the config with the new config.
  config = newConfig;
  writeConfig();
}

function setConfigSetting(key, value) {
  // Set a single config setting.
  config[key] = value;
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
  getConfigSetting: getConfigSetting,
  setConfig: setConfig,
  setConfigSetting: setConfigSetting,
};