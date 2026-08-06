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
            </main>
        </>
    );
}

export default HomePage;