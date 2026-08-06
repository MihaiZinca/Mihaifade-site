import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

function Navbar() {
    const navigate = useNavigate();

    const handleBooking = () => {
        if (isAuthenticated()) {
            navigate("/programare");
            return;
        }

        navigate("/login");
    };

    const handleAccount = () => {
        if (isAuthenticated()) {
            navigate("/cont");
            return;
        }

        navigate("/login");
    };

    return (
        <header className="navbar">
            <Link to="/" className="navbar__brand">
                MIHAIFADE
            </Link>

            <nav className="navbar__links">
                <a href="#servicii">Servicii</a>
                <a href="#galerie">Galerie</a>
                <a href="#contact">Contact</a>
            </nav>

            <div className="navbar__actions">
                <button
                    type="button"
                    className="navbar__login"
                    onClick={handleAccount}
                >
                    Cont
                </button>

                <button
                    type="button"
                    className="navbar__booking"
                    onClick={handleBooking}
                >
                    Programează-te
                </button>
            </div>
        </header>
    );
}

export default Navbar;