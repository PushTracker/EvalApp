import { isIOS } from 'tns-core-modules/platform';
import * as app from 'tns-core-modules/application';
import { Page } from 'tns-core-modules/ui/page';

/**
 * Sets margins for the safe area on iOS devices with safeAreaInsets
 * @param page [Page] - The page instance.
 */
export function setMarginForIosSafeArea(page: Page) {
  console.log(
    `TODO: newer iOS devices might change the layout and NS versions abstractions
    could change. So the values could be different.`
  );
  if (isIOS && page.actionBarHidden) {
    console.log('not adding margin for the page');
    const safeAreaInsets = getSafeAreaInsets() as UIEdgeInsets;
    if (safeAreaInsets) {
      page.marginBottom = -1 * safeAreaInsets.bottom;
      page.marginTop = -1 * safeAreaInsets.top;
    }
  }
}

export function getSafeAreaInsets():
  | undefined
  | {
      top: number;
      left: number;
      bottom: number;
      right: number;
    } {
  if (isIOS && app.ios.window.safeAreaInsets) {
    return app.ios.window.safeAreaInsets;
  } else {
    return undefined;
  }
}
