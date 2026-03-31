import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ToastContext';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'EQuiz - College Quiz Management System',
  description: 'Modern quiz management platform for colleges. Create, share, and manage quizzes with QR codes, analytics, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
