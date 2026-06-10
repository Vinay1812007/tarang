import { cn } from '@/utils/cn';

/** Auto-scrolling text for long titles; static truncation for short ones. */
export function Marquee({ text, className }: { text: string; className?: string }) {
  if (text.length <= 24) {
    return <span className={cn('block truncate', className)}>{text}</span>;
  }
  return (
    <span className={cn('block overflow-hidden whitespace-nowrap', className)}>
      <span className="inline-block animate-marquee will-change-transform">
        {text}
        <span className="inline-block w-16" aria-hidden />
        <span aria-hidden>{text}</span>
        <span className="inline-block w-16" aria-hidden />
      </span>
    </span>
  );
}
