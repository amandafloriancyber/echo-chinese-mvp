
import * as React from 'react';
type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default'|'secondary'|'outline' };
export function Badge({ className='', variant='default', ...props }: Props) {
  const cls = variant === 'secondary' ? 'badge bg-zinc-100' : variant==='outline' ? 'badge bg-white' : 'badge bg-zinc-50';
  return <span className={`${cls} ${className}`} {...props} />;
}
