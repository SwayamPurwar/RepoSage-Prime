import type { Metadata } from 'next' 
import { ClerkProvider } from '@clerk/nextjs' 
import { Cormorant_Garamond, DM_Mono, Plus_Jakarta_Sans } from 'next/font/google' 
import { Toaster } from '@/components/ui/toaster' 
import './globals.css' 
  
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'], 
  variable: '--font-cormorant', 
}) 

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'], 
  variable: '--font-jakarta', 
}) 
  
const dmMono = DM_Mono({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500'], 
  variable: '--font-dm-mono', 
}) 
  
export const metadata: Metadata = { 
  title: 'RespoSage Prime — Flagship Code Intelligence Platform', 
  description: 'Flagship AI platform for engineering teams that demand premium code intelligence, strategic review depth, and executive-ready repository insight.', 
} 
  
export default function RootLayout({ 
  children, 
}: Readonly<{ 
  children: React.ReactNode 
}>) { 
  return ( 
    <ClerkProvider> 
      <html lang="en" className={`${cormorant.variable} ${jakarta.variable} ${dmMono.variable}`}> 
        <body className="font-ui antialiased"
        suppressHydrationWarning
        > 
          {children} 
          <Toaster /> 
        </body> 
      </html> 
    </ClerkProvider> 
  ) 
} 
