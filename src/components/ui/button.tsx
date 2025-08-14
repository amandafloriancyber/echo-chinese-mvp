
import * as React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'secondary'|'outline'|'destructive' };
export function Button({ className='', variant='default', ...props }: Props) {
  const variantCls = {
    default: 'btn btn-primary',
    secondary: 'btn',
    outline: 'btn btn-ghost',
    destructive: 'btn bg-red-600 text-white border-red-600 hover:bg-red-700'
  }[variant];
  return <button className={`${variantCls} ${className}`} {...props} />;
}
