import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";
import api from "../services/api";
import { saveAuth } from "../services/auth";
import "./password-reset.css";

interface LoginResponse {
    token: string;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "CLIENT" | "BARBER" | "OWNER";
    requiresProfileCompletion: boolean;
}

interface MessageResponse {
    message: string;
}

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailNotVerified, setEmailNotVerified] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setEmailNotVerified(false);
        setResendMessage("");
        setLoading(true);

        try {
            const response = await api.post<LoginResponse>(
                "/auth/login",
                {
                    email: email.trim().toLowerCase(),
                    password,
                }
            );

            saveAuth(
                response.data.token,
                response.data.role
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

            navigate("/programare", {
                replace: true,
            });
        } catch (requestError) {
            if (axios.isAxiosError(requestError)) {
                const responseData = requestError.response?.data;

                const responseText =
                    typeof responseData === "string"
                        ? responseData
                        : JSON.stringify(responseData ?? {});

                if (
                    responseText.includes(
                        "EMAIL_NOT_VERIFIED"
                    )
                ) {
                    setEmailNotVerified(true);
                    setError(
                        "Adresa de email nu a fost confirmată. Verifică inboxul sau solicită un nou email de confirmare."
                    );
                    return;
                }
            }

            setError(
                "Email sau parolă incorectă."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail || resending) {
            return;
        }

        setResending(true);
        setError("");
        setResendMessage("");

        try {
            const response =
                await api.post<MessageResponse>(
                    "/auth/resend-verification",
                    {
                        email: normalizedEmail,
                    }
                );

            setResendMessage(
                response.data.message
            );
        } catch {
            setError(
                "Emailul de confirmare nu a putut fi retrimis momentan. Încearcă din nou peste puțin timp."
            );
        } finally {
            setResending(false);
        }
    };

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
                    AUTENTIFICARE
                </p>

                <h1>
                    Intră în cont.
                </h1>

                <p className="auth-card__description">
                    Autentifică-te pentru a gestiona
                    programările și contul tău.
                </p>

                <GoogleLoginButton />

                <div className="auth-divider">
                    <span>
                        sau
                    </span>
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Email

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(
                                    event.target.value
                                );
                                setEmailNotVerified(false);
                                setResendMessage("");
                            }}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Parolă

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    <div className="password-reset-link">
                        <Link to="/forgot-password">
                            Ai uitat parola?
                        </Link>
                    </div>

                    {error && (
                        <p className="auth-form__error">
                            {error}
                        </p>
                    )}

                    {resendMessage && (
                        <p className="auth-form__success">
                            {resendMessage}
                        </p>
                    )}

                    {emailNotVerified && (
                        <button
                            type="button"
                            onClick={
                                handleResendVerification
                            }
                            disabled={resending}
                        >
                            {resending
                                ? "Se retrimite..."
                                : "Retrimite emailul de confirmare"}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Se autentifică..."
                            : "Intră în cont"}
                    </button>
                </form>

                <p className="auth-card__register">
                    Nu ai cont?{" "}

                    <Link to="/register">
                        Creează cont
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default LoginPage;