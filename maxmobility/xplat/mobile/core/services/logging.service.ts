import { Injectable } from '@angular/core';
import { Sentry, SentryOptions } from 'nativescript-sentry';

export class LoggingUtil {
  public static debug = true;
}

export const CLog = (...args) => {
  if (LoggingUtil.debug) {
    console.log(args);
  }
};

@Injectable()
export class LoggingService {
  constructor() {}
  /**
   * Will console.log() the error argument. If devmode is false then we capture
   * the exception with Sentry logging.
   * @param err
   */
  public logException(exception: Error, options: SentryOptions = {}) {
    console.log(exception);

    // Sentry.setContextUser({
    //   email: this._userService.user.email,
    //   id: this._userService.user._id
    // });

    // const extras: SentryOptions = {
    //   extra: {
    //     user: {
    //       email: this._userService.user.email,
    //       id: this._userService.user._id
    //     }
    //   }
    // };

    // if error type
    if (exception instanceof Error) {
      Sentry.captureException(exception, options);
    } else {
      Sentry.captureMessage(exception as any, options);
    }
  }

  public logMessage(message: string, options: SentryOptions = {}) {
    console.log(message);
    Sentry.captureMessage(message, options);
  }
}
