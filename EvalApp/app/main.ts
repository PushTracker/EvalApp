// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app.module";

import {registerElement} from "nativescript-angular/element-registry";
registerElement("Carousel", () => require("nativescript-carousel").Carousel);
registerElement("CarouselItem", () => require("nativescript-carousel").CarouselItem);

platformNativeScriptDynamic().bootstrapModule(AppModule);
