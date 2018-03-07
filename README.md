# Max-Mobility

### Project Structure

The project structure follows the [Nx workspace](https://nrwl.io/nx/guide-nx-workspace#create-a-new-nx-workspace) approach with the added `xplat` directory for platform specific code for various environments: mobile, web, desktop, etc.

### Running the mobile app

Execute - `cd maxmobility && npm run start.mobile.android`

This should path down to the `apps/mobile` dir and exec the `tns run android` cmd to start the mobile app.

_A postinstall script should install the dependencies, if you get an error about node_modules, then run `npm i` to install deps._
