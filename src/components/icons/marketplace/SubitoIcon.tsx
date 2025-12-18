import Image from 'next/image';

export function SubitoIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <Image 
      src="/icons/subito.png"
      alt="Subito"
      width={size} 
      height={size}
      className={className}
    />
  );
}
