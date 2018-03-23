import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { HomeComponent } from './components/home.component';
import { AuthGuardService } from '@maxmobility/mobile';
import { FeaturedComponent, HOME_COMPONENTS } from './components';
import { TranslateModule } from '@ngx-translate/core';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
    // children: [
    //   {
    //     path: 'featured',
    //     component: FeaturedComponent,
    //     canActivate: [AuthGuardService]
    //   }
    // { path: 'home', loadChildren: './modules/home/components/home/home.module#HomeModule' },
    // { path: 'home/account', loadChildren: './modules/home/components/account/account.module#AccountModule' },
    // { path: 'home/videos', loadChildren: './modules/home/components/browse/browse.module#BrowseModule' },
    // { path: 'home/eval', loadChildren: './modules/home/components/search/search.module#SearchModule' },
    // { path: 'home/training', loadChildren: './modules/home/components/training/training.module#TrainingModule' },
    // { path: 'home/trial', loadChildren: './modules/home/components/trial/trial.module#TrialModule' },
    // {
    //   path: 'home/evalEntry',
    //   loadChildren: './modules/home/components/eval-entry-view/eval-entry.module#EvalEntryModule'
    // },
    // { path: 'home/summary', loadChildren: './modules/home/components/summary/summary.module#SummaryModule' },
    // { path: 'home/demos', pathMatch: 'full', loadChildren: './components/demos/demos.module#DemosModule' },
    // { path: 'home/faq', loadChildren: './modules/home/components/faq/faq.module#FAQModule' },
    // { path: 'home/settings', loadChildren: './modules/home/components/settings/settings.module#SettingsModule' }
    // ]
  }
];

const MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptRouterModule,
  NativeScriptUIListViewModule,
  NativeScriptUISideDrawerModule,
  TranslateModule,
  TNSFontIconModule
];

@NgModule({
  imports: [...MODULES, NativeScriptRouterModule.forChild(routes)],
  declarations: [...HOME_COMPONENTS],
  exports: [...MODULES, ...HOME_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class HomeModule {}
