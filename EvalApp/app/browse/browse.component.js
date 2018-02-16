"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var sidedrawer_1 = require("nativescript-pro-ui/sidedrawer");
var angular_1 = require("nativescript-pro-ui/sidedrawer/angular");
var element_registry_1 = require("nativescript-angular/element-registry");
element_registry_1.registerElement("VideoPlayer", function () { return require("nativescript-videoplayer").Video; });
var BrowseComponent = /** @class */ (function () {
    function BrowseComponent() {
        this.videos = [
            { Title: "Lesson 1", Image: "&#xf05a;", Description: "SmartDrive MX2+ Overview" },
            { Title: "Lesson 2", Image: "&#xf008;", Description: "How to do a proper tap gesture" },
            { Title: "Lesson 3", Image: "&#xf0ae;", Description: "How to do a Smart Drive Eval" },
            { Title: "Lesson 4", Image: "&#xf019;", Description: "How to do Over the Air Firmware Updates" },
            { Title: "Lesson 5", Image: "&#xf02a;", Description: "How to adjust setings" },
            { Title: "Lesson 6", Image: "&#xf059;", Description: "PushTracker Overview" }
        ];
    }
    /* ***********************************************************
    * Use the sideDrawerTransition property to change the open/close animation of the drawer.
    *************************************************************/
    BrowseComponent.prototype.ngOnInit = function () {
        this._sideDrawerTransition = new sidedrawer_1.SlideInOnTopTransition();
    };
    Object.defineProperty(BrowseComponent.prototype, "sideDrawerTransition", {
        get: function () {
            return this._sideDrawerTransition;
        },
        enumerable: true,
        configurable: true
    });
    /* ***********************************************************
    * According to guidelines, if you have a drawer on your page, you should always
    * have a button that opens it. Use the showDrawer() function to open the app drawer section.
    *************************************************************/
    BrowseComponent.prototype.onDrawerButtonTap = function () {
        this.drawerComponent.sideDrawer.showDrawer();
    };
    BrowseComponent.prototype.onItemTapThirdList = function (args) {
        console.log(args.index);
    };
    __decorate([
        core_1.ViewChild("drawer"),
        __metadata("design:type", angular_1.RadSideDrawerComponent)
    ], BrowseComponent.prototype, "drawerComponent", void 0);
    BrowseComponent = __decorate([
        core_1.Component({
            selector: "Browse",
            moduleId: module.id,
            templateUrl: "./browse.component.html",
            styleUrls: ["./browse.component.css"]
        })
    ], BrowseComponent);
    return BrowseComponent;
}());
exports.BrowseComponent = BrowseComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBNkQ7QUFDN0QsNkRBQThGO0FBQzlGLGtFQUFnRjtBQUVoRiwwRUFBd0U7QUFDeEUsa0NBQWUsQ0FBQyxhQUFhLEVBQUUsY0FBTSxPQUFBLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLEtBQUssRUFBekMsQ0FBeUMsQ0FBQyxDQUFDO0FBUWhGO0lBTkE7UUFPSSxXQUFNLEdBQUc7WUFDTCxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUM7WUFDL0UsRUFBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFDO1lBQ3JGLEVBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSw4QkFBOEIsRUFBQztZQUNuRixFQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUseUNBQXlDLEVBQUM7WUFDOUYsRUFBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFDO1lBQzVFLEVBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBQztTQUM5RSxDQUFDO0lBNEJOLENBQUM7SUF0Qkc7O2tFQUU4RDtJQUM5RCxrQ0FBUSxHQUFSO1FBQ0ksSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksbUNBQXNCLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBRUQsc0JBQUksaURBQW9CO2FBQXhCO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztRQUN0QyxDQUFDOzs7T0FBQTtJQUVEOzs7a0VBRzhEO0lBQzlELDJDQUFpQixHQUFqQjtRQUNJLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCw0Q0FBa0IsR0FBbEIsVUFBbUIsSUFBSTtRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBekJvQjtRQUFwQixnQkFBUyxDQUFDLFFBQVEsQ0FBQztrQ0FBa0IsZ0NBQXNCOzREQUFDO0lBVnBELGVBQWU7UUFOM0IsZ0JBQVMsQ0FBQztZQUNQLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUseUJBQXlCO1lBQ3RDLFNBQVMsRUFBRSxDQUFDLHdCQUF3QixDQUFDO1NBQ3hDLENBQUM7T0FDVyxlQUFlLENBb0MzQjtJQUFELHNCQUFDO0NBQUEsQUFwQ0QsSUFvQ0M7QUFwQ1ksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgVmlld0NoaWxkIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcclxuaW1wb3J0IHsgRHJhd2VyVHJhbnNpdGlvbkJhc2UsIFNsaWRlSW5PblRvcFRyYW5zaXRpb24gfSBmcm9tIFwibmF0aXZlc2NyaXB0LXByby11aS9zaWRlZHJhd2VyXCI7XHJcbmltcG9ydCB7IFJhZFNpZGVEcmF3ZXJDb21wb25lbnQgfSBmcm9tIFwibmF0aXZlc2NyaXB0LXByby11aS9zaWRlZHJhd2VyL2FuZ3VsYXJcIjtcclxuXHJcbmltcG9ydCB7IHJlZ2lzdGVyRWxlbWVudCB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9lbGVtZW50LXJlZ2lzdHJ5XCI7XHJcbnJlZ2lzdGVyRWxlbWVudChcIlZpZGVvUGxheWVyXCIsICgpID0+IHJlcXVpcmUoXCJuYXRpdmVzY3JpcHQtdmlkZW9wbGF5ZXJcIikuVmlkZW8pO1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgICBzZWxlY3RvcjogXCJCcm93c2VcIixcclxuICAgIG1vZHVsZUlkOiBtb2R1bGUuaWQsXHJcbiAgICB0ZW1wbGF0ZVVybDogXCIuL2Jyb3dzZS5jb21wb25lbnQuaHRtbFwiLFxyXG4gICAgc3R5bGVVcmxzOiBbXCIuL2Jyb3dzZS5jb21wb25lbnQuY3NzXCJdXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBCcm93c2VDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xyXG4gICAgdmlkZW9zID0gW1xyXG4gICAgICAgIHtUaXRsZTogXCJMZXNzb24gMVwiLCBJbWFnZTogXCImI3hmMDVhO1wiLCBEZXNjcmlwdGlvbjogXCJTbWFydERyaXZlIE1YMisgT3ZlcnZpZXdcIn0sXHJcbiAgICAgICAge1RpdGxlOiBcIkxlc3NvbiAyXCIsIEltYWdlOiBcIiYjeGYwMDg7XCIsIERlc2NyaXB0aW9uOiBcIkhvdyB0byBkbyBhIHByb3BlciB0YXAgZ2VzdHVyZVwifSxcclxuICAgICAgICB7VGl0bGU6IFwiTGVzc29uIDNcIiwgSW1hZ2U6IFwiJiN4ZjBhZTtcIiwgRGVzY3JpcHRpb246IFwiSG93IHRvIGRvIGEgU21hcnQgRHJpdmUgRXZhbFwifSxcclxuICAgICAgICB7VGl0bGU6IFwiTGVzc29uIDRcIiwgSW1hZ2U6IFwiJiN4ZjAxOTtcIiwgRGVzY3JpcHRpb246IFwiSG93IHRvIGRvIE92ZXIgdGhlIEFpciBGaXJtd2FyZSBVcGRhdGVzXCJ9LFxyXG4gICAgICAgIHtUaXRsZTogXCJMZXNzb24gNVwiLCBJbWFnZTogXCImI3hmMDJhO1wiLCBEZXNjcmlwdGlvbjogXCJIb3cgdG8gYWRqdXN0IHNldGluZ3NcIn0sXHJcbiAgICAgICAge1RpdGxlOiBcIkxlc3NvbiA2XCIsIEltYWdlOiBcIiYjeGYwNTk7XCIsIERlc2NyaXB0aW9uOiBcIlB1c2hUcmFja2VyIE92ZXJ2aWV3XCJ9XHJcbiAgICBdO1xyXG5cclxuICAgIEBWaWV3Q2hpbGQoXCJkcmF3ZXJcIikgZHJhd2VyQ29tcG9uZW50OiBSYWRTaWRlRHJhd2VyQ29tcG9uZW50O1xyXG5cclxuICAgIHByaXZhdGUgX3NpZGVEcmF3ZXJUcmFuc2l0aW9uOiBEcmF3ZXJUcmFuc2l0aW9uQmFzZTtcclxuXHJcbiAgICAvKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgKiBVc2UgdGhlIHNpZGVEcmF3ZXJUcmFuc2l0aW9uIHByb3BlcnR5IHRvIGNoYW5nZSB0aGUgb3Blbi9jbG9zZSBhbmltYXRpb24gb2YgdGhlIGRyYXdlci5cclxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgICBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9zaWRlRHJhd2VyVHJhbnNpdGlvbiA9IG5ldyBTbGlkZUluT25Ub3BUcmFuc2l0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNpZGVEcmF3ZXJUcmFuc2l0aW9uKCk6IERyYXdlclRyYW5zaXRpb25CYXNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc2lkZURyYXdlclRyYW5zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICogQWNjb3JkaW5nIHRvIGd1aWRlbGluZXMsIGlmIHlvdSBoYXZlIGEgZHJhd2VyIG9uIHlvdXIgcGFnZSwgeW91IHNob3VsZCBhbHdheXNcclxuICAgICogaGF2ZSBhIGJ1dHRvbiB0aGF0IG9wZW5zIGl0LiBVc2UgdGhlIHNob3dEcmF3ZXIoKSBmdW5jdGlvbiB0byBvcGVuIHRoZSBhcHAgZHJhd2VyIHNlY3Rpb24uXHJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gICAgb25EcmF3ZXJCdXR0b25UYXAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kcmF3ZXJDb21wb25lbnQuc2lkZURyYXdlci5zaG93RHJhd2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25JdGVtVGFwVGhpcmRMaXN0KGFyZ3MpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmdzLmluZGV4KTtcclxuICAgIH1cclxufVxyXG4iXX0=