/**
 * S3 Client
 * Handles direct upload to S3 bucket for analytics events
 */

import type { AnalyticsConfig, AnalyticsEvent } from '@/types/analytics';
import { S3Client as AWSS3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Client {
  private s3Client: AWSS3Client;
  private bucketName: string;

  constructor(config: AnalyticsConfig) {
    this.bucketName = config.s3BucketName;

    this.s3Client = new AWSS3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    });
  }

  /**
   * Upload single analytics event to S3
   */
  async uploadEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const csvData = this.convertEventToCSV(event);
      const key = this.generateS3Key(event.timestamp);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: csvData,
        ContentType: 'text/csv',
        Metadata: {
          eventType: event.eventType,
          userId: event.userId,
          timestamp: event.timestamp,
        },
      });

      await this.s3Client.send(command);
      console.log(`Analytics event uploaded to S3: ${key}`);
    } catch (error) {
      console.error('Failed to upload event to S3:', error);
      throw error;
    }
  }

  /**
   * Upload batch of analytics events to S3
   */
  async uploadEventBatch(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const csvData = this.convertEventBatchToCSV(events);
      const timestamp = events[0].timestamp;
      const key = this.generateBatchS3Key(timestamp, events.length);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: csvData,
        ContentType: 'text/csv',
        Metadata: {
          eventCount: events.length.toString(),
          batchTimestamp: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);
      console.log(
        `Analytics event batch uploaded to S3: ${key} (${events.length} events)`
      );
    } catch (error) {
      console.error('Failed to upload event batch to S3:', error);
      throw error;
    }
  }

  /**
   * Convert single event to CSV format
   */
  private convertEventToCSV(event: AnalyticsEvent): string {
    const header =
      'timestamp,event_type,content_type_id,user_id,latitude,longitude,weather,direction,distance,destination_lat,destination_lng,distance_to_destination\n';
    const row = this.eventToCSVRow(event);
    return header + row;
  }

  /**
   * Convert event batch to CSV format
   */
  private convertEventBatchToCSV(events: AnalyticsEvent[]): string {
    const header =
      'timestamp,event_type,content_type_id,user_id,latitude,longitude,weather,direction,distance,destination_lat,destination_lng,distance_to_destination\n';
    const rows = events.map((event) => this.eventToCSVRow(event)).join('\n');
    return header + rows;
  }

  /**
   * Convert single event to CSV row
   */
  private eventToCSVRow(event: AnalyticsEvent): string {
    const {
      timestamp,
      eventType,
      contentTypeId,
      userId,
      latitude = '',
      longitude = '',
      weather = '',
      additionalData = {},
    } = event;

    const {
      direction = '',
      distance = '',
      destinationLat = '',
      destinationLng = '',
      distanceToDestination = '',
    } = additionalData;

    return [
      timestamp,
      eventType,
      contentTypeId,
      userId,
      latitude,
      longitude,
      weather,
      direction,
      distance,
      destinationLat,
      destinationLng,
      distanceToDestination,
    ].join(',');
  }

  /**
   * Generate S3 key with date-based organization
   */
  private generateS3Key(timestamp: string): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const millisecond = String(date.getMilliseconds()).padStart(3, '0');

    return `analytics/${year}/${month}/${day}/event_${year}${month}${day}_${hour}${minute}${second}_${millisecond}.csv`;
  }

  /**
   * Generate S3 key for batch upload
   */
  private generateBatchS3Key(timestamp: string, eventCount: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `analytics/${year}/${month}/${day}/batch_${year}${month}${day}_${hour}${minute}${second}_${eventCount}events.csv`;
  }
}
