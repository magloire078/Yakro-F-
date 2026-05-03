import { Fraunces, Plus_Jakarta_Sans, Sora } from 'next/font/google';

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  // Optical sizing gives beautiful contrast between thin and thick strokes
  axes: ['opsz', 'SOFT', 'WONK'],
});

export const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});
