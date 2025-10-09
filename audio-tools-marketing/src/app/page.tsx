import CTA from '@/components/CTA';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Tools Pro - Professional Audio Analysis for Adobe Premiere Pro',
  description: 'Transform your Adobe Premiere Pro workflow with AI-powered silence detection, overlap analysis, multi-track handling, and professional audio processing capabilities.',
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}