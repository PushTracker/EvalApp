// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from 'nativescript-angular/platform';
import { AppModule } from './app.module';

// import global stuff here
import './async-await';

platformNativeScriptDynamic().bootstrapModule(AppModule);
