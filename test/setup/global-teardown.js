const isPortReachable = require('is-port-reachable');
const path = require('path');
const isCI = require('is-ci');
const dockerCompose = require('docker-compose');

module.exports = async () => {
  // console.log("[global-teardown] Dropping database...")
  // await dockerCompose.exec(
  //   'database',
  //   ['psql', '-U', 'postgres', '-c', '"drop database sensors"'],
  //   { cwd: path.join(__dirname) },
  // );

  // console.log("[global-teardown] Re-creating database...")
  // await dockerCompose.exec(
  //   'database',
  //   ['psql', '-U', 'postgres', '-c', '"create database sensors"'],
  //   { cwd: path.join(__dirname) },
  // );

  if (isCI) {
    dockerCompose.down();
  }
};

