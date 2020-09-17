const plan = require('flightplan');

var appName = 'test';
var username = 'deploy';
var startFile = 'server.js';

var tmpDir = appName+'-' + new Date().getTime();

plan.target('production', 
  {
    host: "209.97.177.228",
    username,
    agent: process.env.SSH_AUTH_SOCK,
    privateKey: 'C:/Users/mcmax/.ssh/id_rsa',
  }
);

plan.local(function(local) {
  local.log('Copy files to remote hosts');
  var filesToCopy = local.exec('git ls-files', {silent: true});
  // rsync files to all the destination's hosts
  local.transfer(filesToCopy, '/tmp/' + tmpDir);
});

// run commands on remote hosts (destinations)
plan.remote(function(remote) {
  remote.log('Move folder to root');
  remote.sudo('cp -R /tmp/' + tmpDir + ' ~', {user: username});
  remote.rm('-rf /tmp/' + tmpDir);

  remote.log('Install dependencies');
  remote.sudo('npm --production --prefix ~/' + tmpDir + ' install ~/' + tmpDir, {user: username});

  remote.log('Reload application');
  remote.sudo('ln -snf ~/' + tmpDir + ' ~/'+appName, {user: username});
  remote.exec('forever stop ~/'+appName+'/'+startFile, {failsafe: true});
  remote.exec('forever start ~/'+appName+'/'+startFile);
});