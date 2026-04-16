import '../public/css/royal-theme.css';
import { Inter, Cinzel, Orbitron } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-display' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-tech' });

export const metadata = {
  title: '3D Pixel Printing | Premium 3D Printing',
  description: 'Premium 3D Printing Destination in India',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${orbitron.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
