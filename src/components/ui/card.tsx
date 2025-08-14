
import * as React from 'react';
export function Card({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}
export function CardHeader({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 border-b border-zinc-200 ${className}`} {...props} />;
}
export function CardTitle({ className='', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-medium ${className}`} {...props} />;
}
export function CardContent({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`} {...props} />;
}
