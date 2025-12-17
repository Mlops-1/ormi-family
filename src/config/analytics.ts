/**
 * Analytics Configuration
 */

import type { AnalyticsConfig } from '@/types/analytics';

export const analyticsConfig: AnalyticsConfig = {
  awsAccessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  awsRegion: import.meta.env.VITE_AWS_REGION || 'ap-northeast-2',
  s3BucketName: import.meta.env.VITE_AWS_S3_BUCKET_NAME || '',
  kinesisStreamName: import.meta.env.VITE_KINESIS_STREAM_NAME || '',
  weatherApiKey: import.meta.env.VITE_WEATHER_API_KEY || '',
  enableLocationTracking: true,
  enableWeatherTracking: true,
};

export const validateConfig = (): boolean => {
  const required = [
    'awsAccessKeyId',
    'awsSecretAccessKey',
    'kinesisStreamName',
  ] as const;

  return required.every((key) => analyticsConfig[key] !== '');
};
