import ContactSection from "../components/ContactSection";
import FinalStatement from "../components/FinalStatement";
import GallerySection from "../components/GallerySection";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import ReviewsSection from "../components/ReviewsSection";
import ServicesSection from "../components/ServicesSection";

function HomePage() {
    return (
        <>
            <Navbar />

            <main>
                <Hero />
                <ServicesSection />
                <GallerySection />
                <ReviewsSection />
                <ContactSection />
                <FinalStatement />
            </main>
        </>
    );
}

export default HomePage;