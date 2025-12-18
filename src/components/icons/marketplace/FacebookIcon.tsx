export function FacebookIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#1877F2"/>
      <path 
        d="M13.5 12.5h2.5l.5-3h-3V8c0-.825.375-1.5 1.5-1.5H16V4.125S15.0625 4 14.1875 4C12.375 4 11 5.2125 11 7.575v1.925H8.5v3H11V20h2.5v-7.5z" 
        fill="white"
      />
    </svg>
  );
}
