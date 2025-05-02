import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from GeistSans
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from './providers';

// Initialize Inter font with the same variable name for CSS compatibility
const inter = Inter({
  variable: '--font-geist-sans', // Keep variable name for simplicity if CSS depends on it
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'Daily Hustle Generator',
  description: 'Generate ideas to make $3 a day',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font variable to the body */}
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
