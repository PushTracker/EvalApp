const fs = require('fs');
const path = require('path');

module.exports = function($logger, $projectData, hookArgs) {
  return new Promise(function(resolve, reject) {
    switch (hookArgs.platform.toLowerCase()) {
      case 'android': {
        resolve();
        break;
      }
      case 'ios': {
        // comments in merged podfiles cause a corrupted podfile https://github.com/NativeScript/nativescript-cli/issues/3549
        // TODO temp for {N} 4.0-rc
        $logger.warn('temp Podfile reprepare fix for {N} 4.0-rc');
        const podfilePath = path.join($projectData.platformsDir, 'ios', 'Podfile');
        fs.unlink(podfilePath, err => resolve());
        break;
      }
      default: {
        reject();
        break;
      }
    }
  });
};
