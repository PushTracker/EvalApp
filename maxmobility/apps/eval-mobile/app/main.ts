// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from 'nativescript-angular/platform';
// import global stuff here
import 'nativescript-localstorage'; // for local/session storage plugin
// util functions (https://github.com/NathanaelA/nativescript-master-technology)
import 'nativescript-master-technology';
import { AppModule } from './app.module';

platformNativeScriptDynamic().bootstrapModule(AppModule);
