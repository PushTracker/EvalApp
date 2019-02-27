// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from 'nativescript-angular/platform';
import 'nativescript-localstorage'; // for local/session storage plugin
import 'nativescript-master-technology'; // util functions (https://github.com/NathanaelA/nativescript-master-technology)
import './async-await';
import * as app from 'tns-core-modules/application';
import { AppModule } from './app.module';
import { BluetoothService } from './services';

// Overriding the app delegate background enter to create a background task so that if we are performing OTAs
// it will continue for the duration of iOS allows
// and hopefully this will allow the OTA to complete.
if (app.ios) {
  const Del = (UIResponder as any).extend(
    {
      applicationDidEnterBackground(application: UIApplication): void {
        BluetoothService.requestOtaBackgroundExecution();
      },

      applicationDidBecomeActive(application: UIApplication): void {
        BluetoothService.stopOtaBackgroundExecution();
      }
    },
    {
      protocols: [UIApplicationDelegate]
    }
  );

  app.ios.delegate = Del;
}

platformNativeScriptDynamic().bootstrapModule(AppModule);
