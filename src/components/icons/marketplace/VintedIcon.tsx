import Image from 'next/image';

export function VintedIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <Image 
      src="/icons/vinted.svg"
      alt="Vinted"
      width={size} 
      height={size}
      className={className}
    />
  );
}
