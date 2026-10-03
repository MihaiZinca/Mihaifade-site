import { Link } from "react-router-dom";
import "./LegalFooter.css";

function LegalFooter() {
    return (
        <footer className="legal-footer">
            <div className="legal-footer__inner">
                <div className="legal-footer__brand">
                    <span className="legal-footer__brand-main">
                        GLOBAL
                    </span>

                    <span className="legal-footer__brand-sub">
                        BARBER SOCIETY
                    </span>
                </div>

                <div className="legal-footer__company">
                    <p>
                        GLOBAL BARBERFADE S.R.L.
                    </p>

                    <p>
                        CUI 55628461 · J2026055638001
                    </p>

                    <p>
                        Pitești, Argeș, România
                    </p>
                </div>

                <nav
                    className="legal-footer__links"
                    aria-label="Informații legale"
                >
                    <Link to="/confidentialitate">
                        Confidențialitate
                    </Link>

                    <Link to="/termeni-si-conditii">
                        Termeni și condiții
                    </Link>

                    <Link to="/cookies">
                        Cookies
                    </Link>

                    <a
                        href="https://reclamatiisal.anpc.ro"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        SAL - ANPC
                    </a>
                </nav>

                <div className="legal-footer__contact">
                    <a href="mailto:globalbarbersociety@yahoo.com">
                        globalbarbersociety@yahoo.com
                    </a>

                    <a href="tel:+40774483769">
                        0774 483 769
                    </a>
                </div>

                <div className="legal-footer__bottom">
                    <p>
                        © 2026 Global Barber Society.
                        Toate drepturile rezervate.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default LegalFooter;