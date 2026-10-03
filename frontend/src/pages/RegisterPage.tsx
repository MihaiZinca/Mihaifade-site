import { useState } from "react";
import { Link } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";
import api from "../services/api";

interface MessageResponse {
    message: string;
}

function RegisterPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setResendMessage("");

        const normalizedPhone = phone.replace(/\s/g, "");
        const normalizedEmail = email.trim().toLowerCase();

        if (!/^07\d{8}$/.test(normalizedPhone)) {
            setError(
                "Introdu un număr valid de telefon, de forma 07xxxxxxxx."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post<MessageResponse>(
                "/auth/register",
                {
                    firstName,
                    lastName,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    password,
                }
            );

            setRegisteredEmail(normalizedEmail);
            setSuccess(response.data.message);
            setPassword("");
        } catch {
            setError(
                "Contul nu a putut fi creat. Emailul sau numărul de telefon poate fi deja folosit."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!registeredEmail || resending) {
            return;
        }

        setResending(true);
        setResendMessage("");
        setError("");

        try {
            const response = await api.post<MessageResponse>(
                "/auth/resend-verification",
                {
                    email: registeredEmail,
                }
            );

            setResendMessage(response.data.message);
        } catch {
            setError(
                "Emailul de confirmare nu a putut fi retrimis momentan. Încearcă din nou peste puțin timp."
            );
        } finally {
            setResending(false);
        }
    };

    if (registeredEmail) {
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
                        Verifică-ți emailul.
                    </h1>

                    <p className="auth-card__description">
                        Am trimis un link de confirmare la{" "}
                        <strong>{registeredEmail}</strong>.
                        Accesează linkul pentru a activa contul.
                    </p>

                    {success && (
                        <p className="auth-form__success">
                            {success}
                        </p>
                    )}

                    {resendMessage && (
                        <p className="auth-form__success">
                            {resendMessage}
                        </p>
                    )}

                    {error && (
                        <p className="auth-form__error">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending
                            ? "Se retrimite..."
                            : "Retrimite emailul"}
                    </button>

                    <p className="auth-card__register">
                        Ai confirmat emailul?{" "}

                        <Link to="/login">
                            Intră în cont
                        </Link>
                    </p>
                </section>
            </main>
        );
    }

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
                    CONT NOU
                </p>

                <h1>
                    Creează cont.
                </h1>

                <p className="auth-card__description">
                    Creează-ți contul pentru programări rapide și acces la
                    programările tale.
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
                    <div className="auth-form__row">
                        <label>
                            Prenume

                            <input
                                type="text"
                                value={firstName}
                                onChange={(event) =>
                                    setFirstName(event.target.value)
                                }
                                autoComplete="given-name"
                                required
                            />
                        </label>

                        <label>
                            Nume

                            <input
                                type="text"
                                value={lastName}
                                onChange={(event) =>
                                    setLastName(event.target.value)
                                }
                                autoComplete="family-name"
                                required
                            />
                        </label>
                    </div>

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

                    <label>
                        Telefon

                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                            placeholder="07xxxxxxxx"
                            autoComplete="tel"
                            inputMode="tel"
                            maxLength={10}
                            required
                        />
                    </label>

                    <label>
                        Parolă

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            minLength={8}
                            autoComplete="new-password"
                            required
                        />
                    </label>

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
                            ? "Se creează..."
                            : "Creează cont"}
                    </button>
                </form>

                <p className="auth-card__register">
                    Ai deja cont?{" "}

                    <Link to="/login">
                        Intră în cont
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default RegisterPage;