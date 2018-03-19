import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { HomeComponent } from './components/home.component';
import { AuthGuardService } from '@maxmobility/mobile';
import { FeaturedComponent, HOME_COMPONENTS } from './components';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'featured',
        component: FeaturedComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: 'profile',
        loadChildren: './components/profile/profile.module#ProfileModule'
      },
      {
        path: 'featured',
        loadChildren: './components/featured/featured.module#FeaturedModule'
      },
      { path: 'account', loadChildren: './account/account.module#AccountModule' },
      { path: 'account', loadChildren: './components/account/account.module#AccountModule' },
      { path: 'home', loadChildren: './components/home/home.module#HomeModule' },
      { path: 'videos', loadChildren: './components/browse/browse.module#BrowseModule' },
      { path: 'eval', loadChildren: './components/search/search.module#SearchModule' },
      { path: 'training', loadChildren: './components/training/training.module#TrainingModule' },
      { path: 'trial', loadChildren: './components/trial/trial.module#TrialModule' },
      { path: 'evalEntry', loadChildren: './components/eval-entry-view/eval-entry.module#EvalEntryModule' },
      { path: 'summary', loadChildren: './components/summary/summary.module#SummaryModule' },
      { path: 'demos', loadChildren: './components/demos/demos.module#DemosModule' },
      { path: 'faq', loadChildren: './components/faq/faq.module#FAQModule' },
      { path: 'settings', loadChildren: './settings/settings.module#SettingsModule' }
    ]
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [...HOME_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class HomeModule {}
