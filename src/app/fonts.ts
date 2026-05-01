
import { Belleza, Alegreya, Caveat } from 'next/font/google';

export const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
});

export const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
});

export const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
});
