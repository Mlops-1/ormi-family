import {
  Input as CloudscapeInput,
  FormField,
} from '@cloudscape-design/components';
import { type InputProps as CloudscapeInputProps } from '@cloudscape-design/components/input';

interface InputProps extends CloudscapeInputProps {
  label?: string;
  error?: string; // Mapped to errorText
  className?: string; // For Tailwind layout
}

export default function Input({
  label,
  error,
  className = '',
  value,
  onChange,
  ...props
}: InputProps) {
  return (
    <div className={className}>
      <FormField label={label} errorText={error}>
        <CloudscapeInput value={value} onChange={onChange} {...props} />
      </FormField>
    </div>
  );
}

export type { InputProps };
