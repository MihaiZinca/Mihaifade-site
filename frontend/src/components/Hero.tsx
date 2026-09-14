import { useNavigate } from "react-router-dom";
import heroImage from "../assets/images/hero.jpg";
import { isAuthenticated } from "../services/auth";

function Hero() {
    const navigate = useNavigate();

    const handleBooking = () => {
        if (isAuthenticated()) {
            navigate("/programare");
            return;
        }

        navigate("/login");
    };

    return (
        <section
            className="hero"
            style={{
                backgroundImage: `linear-gradient(
                    90deg,
                    rgba(0, 0, 0, 0.85) 0%,
                    rgba(0, 0, 0, 0.58) 45%,
                    rgba(0, 0, 0, 0.22) 100%
                ), url(${heroImage})`,
            }}
        >
            <div className="hero__content">

                <h1 className="hero__title">
                    Nu e doar un fade,
                    <span>
                        e Mihai Fade.
                    </span>
                </h1>

                <p className="hero__description">
                    Stil construit cu precizie, atenție la detalii și experiență
                    făcută pentru fiecare client.
                </p>

                <div className="hero__actions">
                    <button
                        type="button"
                        className="hero__primary"
                        onClick={handleBooking}
                    >
                        Programează-te
                    </button>

                    <a
                        href="#servicii"
                        className="hero__secondary"
                    >
                        Vezi serviciile
                    </a>
                </div>
            </div>
        </section>
    );
}

export default Hero;