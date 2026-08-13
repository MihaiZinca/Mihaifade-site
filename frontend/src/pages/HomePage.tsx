import ContactSection from "../components/ContactSection";
import FinalStatement from "../components/FinalStatement";
import GallerySection from "../components/GallerySection";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import ServicesSection from "../components/ServicesSection";

function HomePage() {
    return (
        <>
            <Navbar />

            <main>
                <Hero />
                <ServicesSection />
                <GallerySection />
                <ContactSection />
                <FinalStatement />
            </main>
        </>
    );
}

export default HomePage;