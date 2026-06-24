import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DashboardPreview />
      <TestimonialsSection />

      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
