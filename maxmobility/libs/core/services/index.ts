import { AnalyticsService } from './analytics.service';
import { LoggingService } from './logging.service';

export const CORE_PROVIDERS: any[] = [AnalyticsService, LoggingService];

export * from './analytics.service';
export * from './logging.service';
