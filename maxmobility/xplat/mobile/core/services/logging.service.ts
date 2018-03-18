export class LoggingUtil {
  public static debug = true;
}

export const CLog = (...args) => {
  if (LoggingUtil.debug) {
    console.log(args);
  }
};

// tslint:disable-next-line:max-classes-per-file
export class LoggingService {
  /**
   * Will console.log() the error argument. If devmode is false then we capture
   * the exception with Sentry logging.
   * @param err
   */
  public static logException(exception: Error) {
    console.log(exception);

    // wire up to some service/api
  }

  public static logMessage(message: string) {
    console.log(message);
    // wire up to service/api
  }
}
