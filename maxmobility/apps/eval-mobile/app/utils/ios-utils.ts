import { isIOS } from 'tns-core-modules/platform';
import { Page } from 'tns-core-modules/ui/page';

export function isiPhoneX(): boolean {
  if (!isIOS) {
    return false;
  }

  // See: https://github.com/NativeScript/ios-runtime/issues/698
  const _SYS_NAMELEN: number = 256;

  const buffer: any = interop.alloc(5 * _SYS_NAMELEN);
  uname(buffer);
  let name: string = NSString.stringWithUTF8String(buffer.add(_SYS_NAMELEN * 4)).toString();

  // Get machine name for Simulator
  if (name === 'x86_64' || name === 'i386') {
    name = NSProcessInfo.processInfo.environment.objectForKey('SIMULATOR_MODEL_IDENTIFIER');
  }

  return name.indexOf('iPhone10') === 0;
}

/**
 * Sets a negative margin top when the page has no actionbar so the page spans under the statusbar on iOS.
 * Sets a margin of -44 for iPhoneX on the page and -20 for other iOS devices.
 * @param page [Page] - The page instance.
 */
export function setMarginForNoActionBarOnPage(page: Page) {
  console.log(
    `TODO: newer iOS devices might change the layout and NS versions abstractions
    could change. So the values could be different.`
  );
  if (isIOS && page.actionBarHidden) {
    page.marginTop = isiPhoneX() ? -44 : -20;
  }
}
