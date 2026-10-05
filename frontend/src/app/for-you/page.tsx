import type { Metadata } from 'next';
import ForYouClient from './ForYouClient';

export const metadata: Metadata = {
  title: 'For you | VehicleWalay',
  description: 'Personalized listings from your search and browse history.',
};

export default function ForYouPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 pb-24 font-sans">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(45,159,211,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <ForYouClient />
      </div>
    </div>
  );
}
