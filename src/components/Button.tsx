import { Button as CloudscapeButton } from '@cloudscape-design/components';
import { type ButtonProps as CloudscapeButtonProps } from '@cloudscape-design/components/button';

interface ButtonProps extends Omit<CloudscapeButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outlined';
  color?: 'default' | 'ember';
  fullWidth?: boolean;
  className?: string;
  onClick?: CloudscapeButtonProps['onClick'];
}

export default function Button({
  variant = 'primary',
  color = 'default',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  // Map our variants to Cloudscape variants
  const getCloudscapeVariant = (
    v: 'primary' | 'secondary' | 'outlined'
  ): CloudscapeButtonProps['variant'] => {
    if (v === 'primary') return 'primary';
    if (v === 'secondary' || v === 'outlined') return 'normal';
    return 'normal';
  };

  // Local style overrides for colors
  const styleOverrides =
    color === 'ember'
      ? ({
          '--color-border-button-normal-default': 'var(--color-ormi-ember-500)',
          '--color-border-button-normal-hover': 'var(--color-ormi-ember-600)',
          '--color-border-button-normal-active': 'var(--color-ormi-ember-600)',
          '--color-text-button-normal-default': 'var(--color-ormi-ember-500)',
          '--color-text-button-normal-active': 'var(--color-ormi-ember-600)',
        } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={`${fullWidth ? 'w-full [&>button]:w-full' : ''} ${className}`}
      style={styleOverrides}
    >
      <CloudscapeButton
        variant={getCloudscapeVariant(variant)}
        fullWidth={fullWidth}
        {...props}
      >
        {children}
      </CloudscapeButton>
    </div>
  );
}

export type { ButtonProps };
