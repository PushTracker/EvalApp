import { Injectable } from '@angular/core';
import { Sentry, SentryBreadcrumb, SentryOptions } from 'nativescript-sentry';
import { UserService } from './user.service';

export class LoggingUtil {
  public static debug = true;
}

export const CLog = (...args) => {
  if (LoggingUtil.debug) {
    // console.log(args);
  }
};

@Injectable()
export class LoggingService {
  constructor(private _userService: UserService) {}
  /**
   * Will log the error argument. If devmode is false then we capture
   * the exception with Sentry logging.
   * @param err
   */
  public logException(exception: Error) {
    // console.log(exception);

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
      Sentry.captureException(exception, {});
    } else {
      Sentry.captureMessage(exception as any, {});
    }
  }

  public logMessage(message: string, options: SentryOptions = {}) {
    Sentry.captureMessage(message, options);
  }

  public logBreadCrumb(
    message,
    category: LoggingCategory = LoggingCategory.Info,
    data = {}
  ) {
    const breadcrumb: SentryBreadcrumb = {
      message,
      category,
      data
    };
    Sentry.captureBreadcrumb(breadcrumb);
  }
}

export enum LoggingCategory {
  Info = 'Info',
  Warning = 'Warning'
}
