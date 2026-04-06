import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner"; // <-- NEW: Import Sonner

// --- Fonts ---
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RepoSage Prime",
  description: "AI-Powered Code Intelligence and Review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{
        elements: {
          formButtonPrimary: "bg-[#d7b47f] hover:bg-[#f2ddbd] text-[#141317]",
          footerActionLink: "text-[#d7b47f] hover:text-[#f2ddbd]"
        }
      }}
    >
      <html lang="en">
        <body className={`${cormorant.variable} ${manrope.variable} ${jetbrainsMono.variable} font-body bg-[#0A0A0A] text-[#f5f2ec] antialiased`}>
          {children}
          
          {/* NEW: Global Toast Provider themed to match your app */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 15, 18, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f5f2ec',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              },
              className: 'backdrop-blur-xl rounded-xl'
            }} 
          />
        </body>
      </html>
    </ClerkProvider>
  );
}