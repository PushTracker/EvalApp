import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// libs
import { NxModule } from '@nrwl/nx';
import { throwIfAlreadyLoaded } from '@maxmobility/helpers';

// app
import { CORE_PROVIDERS } from './services';

export const BASE_PROVIDERS: any[] = [
  ...CORE_PROVIDERS,
  {
    provide: APP_BASE_HREF,
    useValue: '/'
  }
];

@NgModule({
  imports: [
    CommonModule,
    // !environment.production ? StoreDevtoolsModule.instrument() : [],
    // StoreRouterConnectingModule
    NxModule.forRoot()
  ]
})
export class CoreModule {
  // configuredProviders: *required to configure WindowService and others per platform
  static forRoot(configuredProviders: Array<any>): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [...BASE_PROVIDERS, ...configuredProviders]
    };
  }

  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
