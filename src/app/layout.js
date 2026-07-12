import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'CardVault - Secure Premium Virtual Cards Marketplace',
  description: 'Buy premium virtual Visa, Mastercard, and Rupay cards instantly. Manage limits, enjoy instant delivery, secure online transactions, and easy payment verification.',
  keywords: 'virtual credit cards, vcc, visa virtual card, mastercard virtual, rupay virtual card, online payment cards, buy virtual card',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
