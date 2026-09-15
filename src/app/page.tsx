import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import TreePreview from "@/components/TreePreview";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ScrollToHash from "@/components/ScrollToHash";
import DiscoverMore from "@/components/DiscoverMore";
import CtaBanner from "@/components/CtaBanner";

export default function Home() {
  return (
    <main>
      <Navbar />
      <ScrollToHash />
      <Hero />
      <Features />
      <DiscoverMore />
      <TreePreview />
      <Gallery />

      <CtaBanner />
      <Contact />
      <Footer />
    </main>
  );
}
