import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

function Navbar() {
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleBooking = () => {
        closeMobileMenu();

        if (isAuthenticated()) {
            navigate("/programare");
            return;
        }

        navigate("/login");
    };

    const handleAccount = () => {
        closeMobileMenu();

        if (isAuthenticated()) {
            navigate("/cont");
            return;
        }

        navigate("/login");
    };

    return (
        <header className="navbar">
            <Link
                to="/"
                className="navbar__brand"
                onClick={closeMobileMenu}
            >
                <span className="navbar__brand-main">
                    GLOBAL
                </span>

                <span className="navbar__brand-sub">
                    BARBER SOCIETY
                </span>
            </Link>

            <nav className="navbar__links">
                <a href="#servicii">
                    Servicii
                </a>

                <a href="#galerie">
                    Galerie
                </a>

                <a href="#recenzii">
                    Recenzii
                </a>

                <a href="#contact">
                    Contact
                </a>
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

                <button
                    type="button"
                    className={
                        mobileMenuOpen
                            ? "navbar__menu-button navbar__menu-button--open"
                            : "navbar__menu-button"
                    }
                    onClick={() =>
                        setMobileMenuOpen(
                            (current) => !current
                        )
                    }
                    aria-label={
                        mobileMenuOpen
                            ? "Închide meniul"
                            : "Deschide meniul"
                    }
                    aria-expanded={
                        mobileMenuOpen
                    }
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div
                className={
                    mobileMenuOpen
                        ? "navbar__mobile navbar__mobile--open"
                        : "navbar__mobile"
                }
            >
                <nav className="navbar__mobile-links">
                    <a
                        href="#servicii"
                        onClick={closeMobileMenu}
                    >
                        Servicii
                    </a>

                    <a
                        href="#galerie"
                        onClick={closeMobileMenu}
                    >
                        Galerie
                    </a>

                    <a
                        href="#recenzii"
                        onClick={closeMobileMenu}
                    >
                        Recenzii
                    </a>

                    <a
                        href="#contact"
                        onClick={closeMobileMenu}
                    >
                        Contact
                    </a>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;