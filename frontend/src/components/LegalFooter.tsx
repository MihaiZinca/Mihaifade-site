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
                </nav>

                <div className="legal-footer__contact">
                    <a href="mailto:globalbarbersociety@yahoo.com">
                        <span>Email</span>
                        globalbarbersociety@yahoo.com
                    </a>

                    <a href="tel:+40774483769">
                        <span>Telefon</span>
                         0774 483 769
                    </a>
                </div>

                

                <div className="legal-footer__bottom">
                    <div className="legal-footer__sal">
                    <a
                        href="https://reclamatiisal.anpc.ro"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Soluționarea alternativă a litigiilor - ANPC"
                    >
                        <img
                            src="/anpc-sal.png"
                            alt="Soluționarea alternativă a litigiilor - ANPC"
                        />
                    </a>
                    </div>
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