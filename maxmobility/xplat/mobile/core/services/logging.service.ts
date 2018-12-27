import { Injectable } from '@angular/core';
import {
  Sentry,
  BreadCrumb,
  ExceptionOptions,
  Level,
  MessageOptions
} from 'nativescript-sentry';
import { UserService } from './user.service';

export class LoggingUtil {
  public static debug = true;
}

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

  public logMessage(message: string, options: MessageOptions = {}) {
    Sentry.captureMessage(message, options);
  }

  public logBreadCrumb(message, level?: Level, category?: string) {
    const breadcrumb: BreadCrumb = {
      message,
      category: category ? category : 'Brad Test',
      level: level ? level : Level.Info
    };
    Sentry.captureBreadcrumb(breadcrumb);
  }
}

export enum LoggingCategory {
  Info = 'Info',
  Warning = 'Warning'
}
