import { Checkbox as CloudscapeCheckbox } from '@cloudscape-design/components';
import { type CheckboxProps as CloudscapeCheckboxProps } from '@cloudscape-design/components/checkbox';

interface CheckboxProps extends CloudscapeCheckboxProps {
  label: string;
  className?: string; // For Tailwind layout
}

export default function Checkbox({
  label,
  className = '',
  checked,
  onChange,
  ...props
}: CheckboxProps) {
  return (
    <div className={className}>
      <CloudscapeCheckbox checked={checked} onChange={onChange} {...props}>
        {label}
      </CloudscapeCheckbox>
    </div>
  );
}

export type { CheckboxProps };
