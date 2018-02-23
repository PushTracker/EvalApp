import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "login", loadChildren: "./login/login.module#LoginModule" },
    { path: "account", loadChildren: "./account/account.module#AccountModule" },
    { path: "home", loadChildren: "./home/home.module#HomeModule" },
    { path: "videos", loadChildren: "./browse/browse.module#BrowseModule" },
    { path: "eval", loadChildren: "./search/search.module#SearchModule" },
    { path: "ota", loadChildren: "./featured/featured.module#FeaturedModule" },
    { path: "demos", loadChildren: "./demos/demos.module#DemosModule" },
    { path: "faq", loadChildren: "./faq/faq.module#FAQModule" },
    { path: "settings", loadChildren: "./settings/settings.module#SettingsModule" }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
