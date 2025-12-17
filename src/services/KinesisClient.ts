/**
 * Kinesis Data Firehose Client
 * Handles streaming analytics events to AWS Kinesis Data Firehose
 */

import type { AnalyticsConfig, AnalyticsEvent } from '@/types/analytics';
import {
  FirehoseClient,
  PutRecordBatchCommand,
  PutRecordCommand,
} from '@aws-sdk/client-firehose';

export class KinesisClient {
  private firehoseClient: FirehoseClient;
  private deliveryStreamName: string;

  constructor(config: AnalyticsConfig) {
    this.deliveryStreamName = config.kinesisStreamName;

    this.firehoseClient = new FirehoseClient({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    });
  }

  /**
   * Send single analytics event to Kinesis Data Firehose
   */
  async putRecord(event: AnalyticsEvent): Promise<void> {
    try {
      const record = this.convertEventToRecord(event);

      // 디버깅을 위한 상세 로그
      console.log('=== Kinesis 전송 디버그 정보 ===');
      console.log('스트림 이름:', this.deliveryStreamName);
      console.log('원본 이벤트:', JSON.stringify(event, null, 2));
      console.log('변환된 레코드:', record);
      console.log('AWS 리전:', this.firehoseClient.config.region);
      console.log('================================');

      const command = new PutRecordCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Record: {
          Data: new TextEncoder().encode(record),
        },
      });

      const response = await this.firehoseClient.send(command);
      console.log(
        `✅ Kinesis Firehose로 이벤트 전송 성공: ${response.RecordId}`
      );
    } catch (error) {
      console.error('❌ Kinesis Firehose 전송 실패:', error);
      console.error('에러 상세:', {
        name: error.name,
        message: error.message,
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
      });
      throw error;
    }
  }

  /**
   * Send batch of analytics events to Kinesis Data Firehose
   */
  async putRecordBatch(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const records = events.map((event) => ({
        Data: new TextEncoder().encode(this.convertEventToRecord(event)),
      }));

      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: records,
      });

      const response = await this.firehoseClient.send(command);

      if (response.FailedPutCount && response.FailedPutCount > 0) {
        console.warn(
          `${response.FailedPutCount} records failed to send to Kinesis Firehose`
        );

        // Log failed records for debugging
        response.RequestResponses?.forEach((record, index) => {
          if (record.ErrorCode) {
            console.error(
              `Record ${index} failed:`,
              record.ErrorCode,
              record.ErrorMessage
            );
          }
        });
      }

      console.log(
        `Analytics event batch sent to Kinesis Firehose: ${
          events.length - (response.FailedPutCount || 0)
        } successful`
      );
    } catch (error) {
      console.error('Failed to send event batch to Kinesis Firehose:', error);
      throw error;
    }
  }

  /**
   * Convert analytics event to Kinesis record format (JSON)
   */
  private convertEventToRecord(event: AnalyticsEvent): string {
    // 간단한 3개 필드만 전송
    const record = {
      user_id: event.userId,
      event_type: event.eventType,
      spot_id: event.contentTypeId,
    };

    return JSON.stringify(record) + '\n';
  }

  /**
   * Test connection to Kinesis Firehose
   */
  async testConnection(): Promise<boolean> {
    try {
      // Send a test record to verify connection
      const testEvent: AnalyticsEvent = {
        timestamp: new Date().toISOString(),
        eventType: 'LIKE',
        contentTypeId: 'test',
        userId: 'test',
      };

      await this.putRecord(testEvent);
      return true;
    } catch (error) {
      console.error('Kinesis Firehose connection test failed:', error);
      return false;
    }
  }
}
