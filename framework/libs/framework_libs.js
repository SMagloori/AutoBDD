const fs = require('fs');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const cmd = require('node-cmd');

// general and system
const spaceChar_regex = /\s+/g;
const invalidFileNameChar_regex = /[\:\;\,\(\)\/\'\"\.\&\%\<\>\-]/g;
const myHOME = process.env.HOME;
const myDISPLAY = process.env.DISPLAY;

// test related
const myPLATFORM = process.env.PLATFORM;
const myDISPLAYSIZE = process.env.DISPLAYSIZE;
const myMOVIE = process.env.MOVIE;
const mySCREENSHOT = process.env.SCREENSHOT;
const myREPORTDIR = process.env.REPORTDIR;
const myRELATIVEREPORTDIR = process.env.RELATIVEREPORTDIR;
const myMODULE = process.env.ThisModule;

// framework essential
const myBROWSER = process.env.BROWSER;
const mySSHHOST = process.env.SSHHOST;
const mySSHPORT = process.env.SSHPORT;
const mySSHUSER = process.env.SSHUSER;
const mySSHPASS = process.env.SSHPASS;
const mySELHOST = process.env.SELHOST;
const mySELPORT = process.env.SELPORT;
const myRDPHOST = process.env.RDPHOST;
const myRDPPORT = process.env.RDPPORT;
const myRDPUSER = process.env.RDPUSER || mySSHUSER;
const myRDPPASS = process.env.RDPPASS || mySSHPASS;
const myMOVIEFR = process.env.MOVIEFR || '8';
const myMOVIERR = process.env.MOVIERR || '1';

// framework deducted
const mySSHConnString = mySSHUSER + '@' + mySSHHOST + ' -p ' + mySSHPORT;
const myRDPConnString = myRDPHOST + ':' + myRDPPORT + ' -u ' + myRDPUSER + ' -p ' + myRDPPASS;
const mySELPortMapString = ' -L' + mySELPORT + ':' + mySELHOST + ':' + 4444;
const myRDPPortMapString = ' -L' + myRDPPORT + ':' + myRDPHOST + ':' + 3389;
const myPlatformIdSrc = myHOME + '/Projects/xyPlatform/global/platform_id_rsa';
const myPlatformIdDes = myHOME + '/.ssh/platform_id_rsa';

// ssh_tunnel
const cmd_copy_PlatformId = 'cp ' + myPlatformIdSrc + ' ' + myPlatformIdDes + ', chmod 0600 ' + myPlatformIdDes;
const myDownloadPathLocal = process.env.DownloadPathLocal || '/tmp/download_' + process.env.DISPLAY.substr(1);
const mySSHFSConnString = mySSHUSER + '@' + mySSHHOST + ':Downloads/ ' + myDownloadPathLocal + ' -p ' + mySSHPORT;
const cmd_check_ssh_tunnel = 'pgrep -f "ssh .*' + mySSHConnString + '"';
const cmd_start_ssh_tunnel = 'ssh -N '
                    + ' -o IdentityFile=' + myPlatformIdDes
                    + ' -o StrictHostKeyChecking=no '
                    + mySSHConnString + mySELPortMapString + myRDPPortMapString
                    + ' &';
const cmd_stop_ssh_tunnel = 'sleep 2; pkill -f "ssh .*' + mySSHConnString + '"';

// sshfs_mount
const cmd_check_sshfs_mount = 'pgrep -f "sshfs .*' + mySSHFSConnString + '"';
const cmd_start_sshfs_mount = 'sshfs -o uid=$(id -u),gid=$(id -g) -o nonempty'
                            + ' -o IdentityFile=' + myPlatformIdDes
                            + ' -o StrictHostKeyChecking=no '
                            + mySSHFSConnString;
const cmd_stop_sshfs_mount = 'if mountpoint -q ' + myDownloadPathLocal
                            + '; then fusermount -u ' + myDownloadPathLocal + '; fi';

// rdesktop
const cmd_check_rdesktop = 'pgrep -f "rdesktop .*' + myRDPHOST + ':' + myRDPPORT + '"';
const cmd_start_rdesktop = 'DISPLAY=' + myDISPLAY
                          + ' rdesktop -fa 16 -mE '
                          + myRDPConnString
                          + ' &';
const cmd_stop_rdesktop = 'pkill -f "rdesktop .*' + myRDPHOST + ':' + myRDPPORT + '"';
const cmd_create_rdesktop_lock = 'echo "' + cmd_start_rdesktop + '"'
                                + ' > /tmp/rdesktop.' + myRDPHOST + ':' + myRDPPORT + '.lock';
const cmd_remove_rdesktop_lock = 'rm -f /tmp/rdesktop.' + myRDPHOST + ':' + myRDPPORT + '.lock';

module.exports = {
  // ssh_tunnel
  sshTunnelRunning: function() {
    // return true if running, false if not
    // filter empty element, total number of pid including self
    var pidCount = execSync(cmd_check_ssh_tunnel).toString().split('\n').filter(Boolean).length
    if (pidCount >= 2) {
      return true;
    } else {
      return false;
    }
  },
  startSshTunnel: function() {
    fs.existsSync(myHOME + '/.ssh') || fs.mkdirSync(myHOME + '/.ssh');
    fs.existsSync(myPlatformIdDes) || execSync(cmd_copy_PlatformId);
    if (!this.sshTunnelRunning()) {
      cmd.run(cmd_start_ssh_tunnel);
    } 
  },
  stopSshTunnel: function() {
    if (this.sshTunnelRunning()) {
      cmd.run(cmd_stop_ssh_tunnel);
    } 
  },

  // sshfs_mount
  sshFsRunning: function() {
    // return true if running, false if not
    // filter empty element, total number of pid including self
    var pidCount = execSync(cmd_check_sshfs_mount).toString().split('\n').filter(Boolean).length
    if (pidCount >= 2) {
      return true;
    } else {
      return false;
    }
  },
  startSshFs: function() {
    fs.existsSync(myDownloadPathLocal) || fs.mkdirSync(myDownloadPathLocal);
    if (!this.sshFsRunning()) {
      execSync(cmd_start_sshfs_mount);
    } 
  },
  stopSshFs: function() {
    if (this.sshFsRunning()) {
      execSync(cmd_stop_sshfs_mount);
    } 
  },

  // rdesktop
  rdesktopRunning: function() {
    // return true if running, false if not
    // filter empty element, total number of pid including self
    var pidCount = execSync(cmd_check_rdesktop).toString().split('\n').filter(Boolean).length
    if (pidCount >= 2) {
      return true;
    } else {
      return false;
    }
  },
  startRdesktop: function() {
    if (!this.rdesktopRunning()) {
      execSync(cmd_create_rdesktop_lock);
      cmd.run(cmd_start_rdesktop);
    } 
  },
  stopRdesktop: function() {
    if (this.rdesktopRunning()) {
      cmd.run(cmd_stop_rdesktop);
      execSync(cmd_remove_rdesktop_lock);
    } 
  },

  // movie and screenshot
  getScenarioNameBase: function(scenarioName) {
    var fileBase = (myPLATFORM + '_' + myBROWSER + '_' + myMODULE + '_' + scenarioName)
                      .replace(spaceChar_regex, '_')
                      .replace(invalidFileNameChar_regex, '');
    return fileBase;
  },
  recordingRunning: function(scenarioName) {
    const scenario_mp4 = this.getScenarioNameBase(scenarioName) + '.mp4';
    const recordingFile_fullPath = myREPORTDIR + '/Recording_' + scenario_mp4;
    const cmd_check_recording = `pgrep -f "ffmpeg .*${recordingFile_fullPath}"`;
    var pidCount = execSync(cmd_check_recording).toString().split('\n').filter(Boolean).length
    if (pidCount >= 2) {
      return true;
    } else {
      return false;
    }
  },
  startRecording: function(scenarioName) {
    const scenario_mp4 = this.getScenarioNameBase(scenarioName) + '.mp4';
    const recordingFile_fullPath = myREPORTDIR + '/Recording_' + scenario_mp4;
    const cmd_start_recording = 'ffmpeg -y -s ' + myDISPLAYSIZE
        + ' -f x11grab -an -nostdin -r ' + myMOVIEFR
        + ' -i ' + myDISPLAY
        + ' -filter:v "setpts=' + myMOVIERR + '*PTS" '
        + recordingFile_fullPath
        + ' 2> /dev/null &';
    if (scenarioName) {
      if (this.recordingRunning(scenarioName)) this.stopRecording(scenarioName);
      exec(cmd_start_recording);
    } else {
      console.log('startRecording: scenarioName can not be empty');
      return false;
    }
  },
  stopRecording: function(scenarioName) {
    const scenario_mp4 = this.getScenarioNameBase(scenarioName) + '.mp4';
    const recordingFile_fullPath = myREPORTDIR + '/Recording_' + scenario_mp4;
    const cmd_stop_recording = `sleep 1; pkill -f "ffmpeg .*${recordingFile_fullPath}"`;
    const cmd_wait_recording_end = 'while lsof '
        + recordingFile_fullPath
        + '; do sleep 1; done;'
        + 'sleep 1;'
        + 'while [ ! -f '
        + recordingFile_fullPath
        + ' ]; do sleep 1; done;'
    if (scenarioName) {
      if (this.recordingRunning(scenarioName))
        try {
          // this command will kill self and always return error, thus must put in a try block
          execSync(cmd_stop_recording);
        } catch(e) {
          console.log(e);
        }      
      } else {
        console.log('stopRecording: scenarioName can not be empty');
        return false;
      }
  },
  renameRecording: function(scenarioName, filePrefix) {
    const scenario_mp4 = this.getScenarioNameBase(scenarioName) + '.mp4';
    const recordingFile_fullPath = myREPORTDIR + '/Recording_' + scenario_mp4;
    const finalFile_fullPath = myREPORTDIR + '/' + filePrefix + '_' + scenario_mp4;
    const cmd_wait_recording_end = 'while lsof '
        + recordingFile_fullPath
        + '; do sleep 1; done;'
        + 'sleep 1;'
        + 'while [ ! -f '
        + recordingFile_fullPath
        + ' ]; do sleep 1; done;'
    const cmd_rename_movie = 'mv ' + recordingFile_fullPath + ' ' + finalFile_fullPath;
    try{
      execSync(cmd_wait_recording_end + cmd_rename_movie);
    } catch(e) {
      console.log(e);
      return false;
    }
  },
  takeScreenshot: function(scenarioName, filePrefix) {
    const scenario_png = this.getScenarioNameBase(scenarioName) + '.png';
    const cmd_take_screenshot = 'import -display ' + myDISPLAY + ' -window root '
        + myREPORTDIR + '/' + filePrefix + '_' + scenario_png;
    if (scenarioName) {
      execSync(cmd_take_screenshot);
    } else {
      console.log('takeScreenshot: scenarioName can not be empty');
      return false;
    }
  },
  getHtmlReportTags: function(scenarioName, filePrefix) {
    const scenario_base = this.getScenarioNameBase(scenarioName);
    const scenario_mp4 = scenario_base + '.mp4';
    const scenario_png = scenario_base + '.png';
    const feature_runlog = process.env.RUNREPORT;
    const image_tag = '<img src="' + myRELATIVEREPORTDIR + '/' + filePrefix + '_' + encodeURIComponent(scenario_png) + '" style="max-width: 100%; height: auto;" alt="' + filePrefix + '_' + scenario_png + '">';
    const video_tag = '<video src="' + myRELATIVEREPORTDIR + '/' + filePrefix + '_' + encodeURIComponent(scenario_mp4) + '" style="max-width: 100%; height: auto;" controls poster="' + filePrefix + '_' + scenario_png + '"/>Your browser does not support the video tag.</video>'; 
    const runlog_tag = '<a href="' + myRELATIVEREPORTDIR + '/' + feature_runlog + '.html" style="max-width: 100%; height: auto;"/>' + feature_runlog + '</a>';
    return [image_tag, video_tag, runlog_tag];
  }
}
