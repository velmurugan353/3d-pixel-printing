import '../public/css/royal-theme.css';
import { Inter, Cinzel, Orbitron } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
  title: '3D Pixel Printing | Premium 3D Printing',
  description: 'Premium 3D Printing Destination in India',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${orbitron.variable}`}>
      <body>{children}</body>
    </html>
  );
}
