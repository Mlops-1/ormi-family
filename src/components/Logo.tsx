interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function Logo({ size = 'large', className = '' }: LogoProps) {
  const sizeStyles = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-7xl sm:text-8xl',
  };

  return (
    <h1
      className={`font-black bg-linear-to-r from-ormi-pink-500 via-ormi-ember-500 to-ormi-pink-500 bg-clip-text text-transparent animate-gradient ${sizeStyles[size]} ${className}`}
    >
      오르미패밀리
    </h1>
  );
}

export type { LogoProps };
