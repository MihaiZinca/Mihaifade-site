import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { saveAuth } from "../services/auth";

interface VerifyEmailResponse {
    token: string;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "CLIENT" | "BARBER" | "OWNER";
    requiresProfileCompletion: boolean;
}

type VerificationStatus =
    | "loading"
    | "success"
    | "error";

function VerifyEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const verificationStarted = useRef(false);

    const [status, setStatus] =
        useState<VerificationStatus>("loading");

    const [message, setMessage] = useState(
        "Confirmăm adresa ta de email..."
    );

    useEffect(() => {
        if (verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage(
                "Linkul de confirmare este invalid."
            );
            return;
        }

        const verifyEmail = async () => {
            try {
                const response =
                    await api.post<VerifyEmailResponse>(
                        "/auth/verify-email",
                        {
                            token,
                        }
                    );

                saveAuth(
                    response.data.token,
                    response.data.role
                );

                setStatus("success");
                setMessage(
                    "Emailul a fost confirmat cu succes."
                );

                if (response.data.role === "OWNER") {
                    navigate("/admin", {
                        replace: true,
                    });
                    return;
                }

                if (response.data.role === "BARBER") {
                    navigate("/barber", {
                        replace: true,
                    });
                    return;
                }

                if (
                    response.data.requiresProfileCompletion
                ) {
                    navigate("/complete-profile", {
                        replace: true,
                    });
                    return;
                }

                navigate("/welcome-reward", {
                    replace: true,
                });
            } catch {
                setStatus("error");
                setMessage(
                    "Linkul de confirmare este invalid, a expirat sau a fost deja folosit."
                );
            }
        };

        void verifyEmail();
    }, [navigate, searchParams]);

    return (
        <main className="auth-page">
            <section className="auth-card auth-card--image">
                <Link
                    to="/"
                    className="auth-card__brand"
                >
                    <span className="auth-card__brand-main">
                        GLOBAL
                    </span>

                    <span className="auth-card__brand-sub">
                        BARBER SOCIETY
                    </span>
                </Link>

                <p className="section-eyebrow">
                    CONFIRMARE EMAIL
                </p>

                <h1>
                    {status === "loading"
                        ? "Se confirmă..."
                        : status === "success"
                            ? "Email confirmat."
                            : "Confirmarea a eșuat."}
                </h1>

                <p className="auth-card__description">
                    {message}
                </p>

                {status === "loading" && (
                    <p className="auth-card__description">
                        Te rugăm să aștepți câteva secunde.
                    </p>
                )}

                {status === "error" && (
                    <p className="auth-card__register">
                        <Link to="/login">
                            Mergi la autentificare
                        </Link>
                    </p>
                )}
            </section>
        </main>
    );
}

export default VerifyEmailPage;