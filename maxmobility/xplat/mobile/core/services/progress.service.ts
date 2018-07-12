import { Injectable } from '@angular/core';
import { LoadingIndicator } from 'nativescript-loading-indicator';

/**
 * Reactive progress indicator
 */
@Injectable()
export class ProgressService {
  // reusable nativescript instance
  private _loader: LoadingIndicator;
  // default options
  private _defaultOptions: any = {
    android: {
      indeterminate: true,
      cancelable: false,
      progressStyle: 0
    },
    ios: {
      background: ''
    }
  };

  constructor() {
    this._loader = new LoadingIndicator();
  }

  /**
   * Shows the loading indicator with the default options
   */
  show(message = 'Processing') {
    this._defaultOptions.message = message;
    this._loader.show(this._defaultOptions);
  }

  /**
   * Hides the loading indicator
   */
  hide() {
    this._loader.hide();
  }
}
