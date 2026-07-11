import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import CustomerExperience from "@/components/landing/CustomerExperience";
import DriverExperience from "@/components/landing/DriverExperience";
import AgencyDashboard from "@/components/landing/AgencyDashboard";
import SmartTracking from "@/components/landing/SmartTracking";
import CitiesSection from "@/components/landing/CitiesSection";
import SecuritySection from "@/components/landing/SecuritySection";
import StatsSection from "@/components/landing/StatsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <WorkflowSection />
      <CustomerExperience />
      <DriverExperience />
      <AgencyDashboard />
      <SmartTracking />
      <CitiesSection />
      <SecuritySection />
      <StatsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
