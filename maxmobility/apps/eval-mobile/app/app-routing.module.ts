import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { AuthGuardService } from '@maxmobility/mobile';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: './modules/login/login.module#LoginModule' },
  { path: 'sign-up', loadChildren: './modules/sign-up/sign-up.module#SignUpModule' },
  { path: 'forgot-password', loadChildren: './modules/forgot-password/forgot-password.module#ForgotPasswordModule' },
  { path: 'home', loadChildren: './modules/home/home.module#HomeModule', canActivate: [AuthGuardService] },
  {
    path: 'featured',
    loadChildren: './modules/home/components/featured/featured.module#FeaturedModule',
    canActivate: [AuthGuardService]
  },
  { path: 'home/account', loadChildren: './modules/home/components/account/account.module#AccountModule' },
  { path: 'home/videos', loadChildren: './modules/home/components/browse/browse.module#BrowseModule' },
  { path: 'home/search', loadChildren: './modules/home/components/search/search.module#SearchModule' },
  { path: 'home/training', loadChildren: './modules/home/components/training/training.module#TrainingModule' },
  { path: 'home/trial', loadChildren: './modules/home/components/trial/trial.module#TrialModule' },
  {
    path: 'home/eval-entry',
    loadChildren: './modules/home/components/eval-entry-view/eval-entry.module#EvalEntryModule'
  },
  { path: 'home/summary', loadChildren: './modules/home/components/summary/summary.module#SummaryModule' },
  { path: 'home/ota', loadChildren: './modules/home/components/featured/featured.module#FeaturedModule' },
  { path: 'home/demos', loadChildren: './modules/home/components/demos/demos.module#DemosModule' },
  { path: 'home/faq', loadChildren: './modules/home/components/faq/faq.module#FAQModule' },
  { path: 'home/settings', loadChildren: './modules/home/components/settings/settings.module#SettingsModule' }
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule]
})
export class AppRoutingModule {}
