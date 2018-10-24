import { AnalyticsService } from './analytics.service';
import { LoggingService } from './logging.service';
import { RouterExtService } from './routerext.service';

export const CORE_PROVIDERS: any[] = [AnalyticsService, LoggingService, RouterExtService];

export * from './analytics.service';
export * from './logging.service';
export * from './routerext.service';
