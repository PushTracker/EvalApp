import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { HomeComponent } from './home.component';
import { AuthGuardService } from '@maxmobility/mobile';
import { FeaturedComponent, HOME_COMPONENTS } from './index';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: 'featured',
        component: FeaturedComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: 'profile',
        loadChildren: './modules/profile/profile.module#ProfileModule'
      },
      {
        path: 'featured',
        loadChildren: './components/featured/featured.module#FeaturedModule'
      }
    ]
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [...HOME_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class HomeModule {}
