import { Belleza, Alegreya, Sora } from 'next/font/google';

export const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
});

export const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
});

export const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});
