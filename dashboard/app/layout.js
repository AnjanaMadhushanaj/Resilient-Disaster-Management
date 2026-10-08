import './globals.css';

export const metadata = {
  title: 'Flood Detection System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
