import Image from 'next/image';

export function EbayIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <Image 
      src="/icons/ebay.png"
      alt="eBay"
      width={size} 
      height={size}
      className={className}
    />
  );
}
