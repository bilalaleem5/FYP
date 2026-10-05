import React from "react";

export function AppleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.03-14.52-5.98-9.14-10.73-19.67-14.26-31.59-3.53-11.92-5.3-23.13-5.3-33.64 0-14.42 3.69-26.4 11.07-35.94 7.37-9.54 16.48-14.42 27.32-14.64 4.58 0 9.85 1.25 15.81 3.76 5.96 2.5 9.77 3.82 11.44 3.94 1.34-.12 5.37-1.49 12.09-4.11 6.72-2.61 12.38-3.81 16.98-3.59 12.7.77 22.84 5.33 30.43 13.68-11.06 6.74-16.48 16.03-16.26 27.87.22 9.35 3.75 17.29 10.59 23.82 6.84 6.53 14.99 10.15 24.45 10.87-2.07 6.42-4.57 12.87-7.51 19.34zM119.22 33.72c0-7.29 2.61-14.25 7.83-20.88 5.22-6.64 11.75-10.97 19.59-12.99.76 2.94 1.14 5.66 1.14 8.16 0 7.4-2.82 14.63-8.47 21.68-5.65 7.06-12.33 11.31-20.04 12.75-.43-2.94-.05-5.85-.05-8.72z" />
    </svg>
  );
}

export function GooglePlayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
      <path fill="#4285F4" d="M47.1 27.2c-5.4 5.7-8.6 14.3-8.6 25.1v407.4c0 10.8 3.2 19.4 8.6 25.1l1.4 1.3L275.9 258.7v-5.4L48.5 25.9l-1.4 1.3z" />
      <path fill="#FBBC04" d="M351.9 334.8l-76-76.1v-5.4l76-76.1 1.7 1 89.8 51.1c25.7 14.6 25.7 38.5 0 53.1l-89.8 51.1-1.7 1.4z" />
      <path fill="#EA4335" d="M275.9 253.3L47.1 24.6C54.7 16.2 67.2 16.6 82 25l271.6 154.3-77.7 74z" />
      <path fill="#34A853" d="M275.9 258.7l77.7 74L82 487c-14.8 8.4-27.3 8.8-34.9.4l228.8-228.7z" />
    </svg>
  );
}

export function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

export function HeartIcon({ className = "h-4 w-4", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function CarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ChartBarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

export function BotIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
