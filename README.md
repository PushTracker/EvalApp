# Max-Mobility

## Setup

Execute `npm run nuki`

## Running the Smart Evaluation mobile app

Execute - `npm run sea.start.android` for Android
Execute - `npm run sea.start.ios` for iOS

- _This should path down to the `apps/smart-eval-app` directory and exec the `tns run android --bundle --env.aot` cmd to start the mobile app._

### Creating release builds for Smart Evaluation (smart-eval-app)

#### Android

Important: you need the .keystore file, this is kept internally. Without it, you cannot create a signed release build.
For the build to work successfully, the script will look for the keystore in the `apps/smart-eval-app/tools/` directory. Image below shows where it should be for the script to work properly.

![keystore](./apps/smart-eval-app/tools/keystore_directory.png)

- Execute `npm run sea.android.release $KEYSTORE_PASSWORD` - replace \$KEYSTORE_PASSWORD with the actual password for the keystore for smart-eval-app). If you do not provide the password argument in the command, you'll be prompted for it.

#### iOS

- Execute `npm run sea.ios.release` - this will create a release build for iOS.
- Open the .xcworkspace file in xcode, the file is located in `apps/smart-eval-app/platforms/ios`
- Make sure the build # has been incremented or the upload will fail if it's already used.
- Create an archive and then upload to iTunesConnect.

- You can try publishing to iOS from the command line but you'll need your apple dev account username and password to execute the `tns publish ios` command. In the past, this has been spotty, so the manual upload through XCode has been more reliable.
