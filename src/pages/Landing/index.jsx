
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer"; 
import Header from "./Header";
import Hero from "./Hero";
import TrustedBy from "./TrustedBy";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import Pricing from "./Pricing";
import CTA from "./CTA";

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if user is already authenticated and initial check is done
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // If still loading or already authenticated (and about to redirect), don't render the landing page content yet.
  // This prevents a flash of the landing page before redirection.
  if (loading || isAuthenticated) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#f3f2ef]">
         {/* You can keep the global loader or use a simpler one here */}
         Cargando... 
       </div>
    ); 
  }

  // Render the landing page only if not loading and not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f2ef] to-white text-gray-800">
      <Header />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer /> 
    </div>
  );
}

export default Landing;
