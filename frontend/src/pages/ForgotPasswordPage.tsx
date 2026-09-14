import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./password-reset.css";

interface MessageResponse {
    message: string;
}

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await api.post<MessageResponse>(
                "/auth/forgot-password",
                {
                    email,
                }
            );

            setMessage(response.data.message);
        } catch {
            setError(
                "A apărut o problemă. Încearcă din nou."
            );
        } finally {
            setLoading(false);
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
                    RESETARE PAROLĂ
                </p>

                <h1>
                    Ai uitat parola?
                </h1>

                <p className="auth-card__description">
                    Introdu adresa de email asociată contului tău.
                    Dacă există un cont cu această adresă, vei primi
                    un link pentru resetarea parolei.
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Email

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            autoComplete="email"
                            required
                        />
                    </label>

                    {message && (
                        <p className="auth-form__success">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="auth-form__error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Se trimite..."
                            : "Trimite linkul de resetare"}
                    </button>
                </form>

                <p className="auth-card__register">
                    Ți-ai amintit parola?{" "}

                    <Link to="/login">
                        Înapoi la autentificare
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default ForgotPasswordPage;
