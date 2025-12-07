import { Flashbar, type FlashbarProps } from '@cloudscape-design/components';
import { type ReactNode } from 'react';

interface NotificationProps {
  items: Array<{
    type?: FlashbarProps.Type;
    content: ReactNode;
    id?: string;
    onDismiss?: () => void;
  }>;
}

export default function Notification({ items }: NotificationProps) {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <Flashbar
        items={items.map((item) => ({
          type: item.type || 'info',
          content: item.content,
          id: item.id,
          dismissible: !!item.onDismiss,
          onDismiss: item.onDismiss,
        }))}
      />
    </div>
  );
}

export type { NotificationProps };
