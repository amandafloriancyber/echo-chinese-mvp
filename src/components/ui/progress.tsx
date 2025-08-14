
import * as React from 'react';
export function Progress({ value=0, className='' }: { value?: number; className?: string; }) {
  const v = Math.max(0, Math.min(100, value));
  return <div className={`progress ${className}`}><span style={{ width: `${v}%` }} /></div>;
}
