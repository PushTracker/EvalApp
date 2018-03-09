import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: './modules/login/login.module#LoginModule' },
  // { path: 'account', loadChildren: './account/account.module#AccountModule' },
  { path: 'account', loadChildren: './modules/account/account.module#AccountModule' },
  { path: 'home', loadChildren: './home/home.module#HomeModule' },
  { path: 'videos', loadChildren: './browse/browse.module#BrowseModule' },
  { path: 'eval', loadChildren: './search/search.module#SearchModule' },
  { path: 'training', loadChildren: './training/training.module#TrainingModule' },
  { path: 'trial', loadChildren: './trial/trial.module#TrialModule' },
  { path: 'evalEntry', loadChildren: './evalEntryView/evalEntry.module#EvalEntryModule' },
  { path: 'summary', loadChildren: './summary/summary.module#SummaryModule' },
  { path: 'ota', loadChildren: './featured/featured.module#FeaturedModule' },
  { path: 'demos', loadChildren: './demos/demos.module#DemosModule' },
  { path: 'faq', loadChildren: './faq/faq.module#FAQModule' },
  { path: 'settings', loadChildren: './settings/settings.module#SettingsModule' },
  { path: 'sign-up', loadChildren: './modules/sign-up/sign-up.module#SignUpModule' }
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule]
})
export class AppRoutingModule {}
