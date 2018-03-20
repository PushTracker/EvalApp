import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { AuthGuardService } from '@maxmobility/mobile';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: './modules/login/login.module#LoginModule' },
  { path: 'sign-up', loadChildren: './modules/sign-up/sign-up.module#SignUpModule' },
  { path: 'forgot-password', loadChildren: './modules/forgot-password/forgot-password.module#ForgotPasswordModule' },
  { path: 'home', loadChildren: './modules/home/home.module#HomeModule' }
  // { path: 'account', loadChildren: './account/account.module#AccountModule' },
  // { path: 'account', loadChildren: './modules/account/account.module#AccountModule' },
  // { path: 'videos', loadChildren: './modules/browse/browse.module#BrowseModule' },
  // { path: 'eval', loadChildren: './modules/search/search.module#SearchModule' },
  // { path: 'training', loadChildren: './modules/training/training.module#TrainingModule' },
  // { path: 'trial', loadChildren: './modules/trial/trial.module#TrialModule' },
  // { path: 'evalEntry', loadChildren: './modules/eval-entry-view/eval-entry.module#EvalEntryModule' },
  // { path: 'summary', loadChildren: './modules/summary/summary.module#SummaryModule' },
  // { path: 'ota', loadChildren: './modules/featured/featured.module#FeaturedModule' },
  // { path: 'demos', loadChildren: './modules/demos/demos.module#DemosModule' },
  // { path: 'faq', loadChildren: './modules/faq/faq.module#FAQModule' },
  // { path: 'settings', loadChildren: './settings/settings.module#SettingsModule' },
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule]
})
export class AppRoutingModule {}
