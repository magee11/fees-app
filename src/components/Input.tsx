import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className = '', ...rest }: InputProps) {
  if (icon) {
    return (
      <div className="input-icon-wrap">
        {icon}
        <input className={`input ${className}`.trim()} {...rest} />
      </div>
    );
  }
  return <input className={`input ${className}`.trim()} {...rest} />;
}
