import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./password-reset.css";

interface MessageResponse {
    message: string;
}

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token") ?? "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!token) {
            setError(
                "Linkul de resetare este invalid."
            );
            return;
        }

        if (newPassword.length < 8) {
            setError(
                "Parola trebuie să conțină cel puțin 8 caractere."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(
                "Parolele nu coincid."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post<MessageResponse>(
                "/auth/reset-password",
                {
                    token,
                    newPassword,
                }
            );

            setMessage(response.data.message);
            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setError(
                "Linkul de resetare este invalid, a expirat sau a fost deja folosit."
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
                    MIHAIFADE
                </Link>

                <p className="section-eyebrow">
                    PAROLĂ NOUĂ
                </p>

                <h1>
                    Setează parola nouă.
                </h1>

                <p className="auth-card__description">
                    Alege o parolă nouă de cel puțin 8 caractere
                    pentru contul tău MihaiFade.
                </p>

                {!success && (
                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >
                        <label>
                            Parolă nouă

                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                        </label>

                        <label>
                            Confirmă parola

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="new-password"
                                minLength={8}
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
                            disabled={loading || !token}
                        >
                            {loading
                                ? "Se salvează..."
                                : "Schimbă parola"}
                        </button>
                    </form>
                )}

                {success && (
                    <>
                        <p className="auth-form__success">
                            {message}
                        </p>

                        <p className="auth-card__register">
                            <Link to="/login">
                                Intră în cont
                            </Link>
                        </p>
                    </>
                )}

                {!success && !token && (
                    <p className="auth-form__error">
                        Linkul de resetare nu conține un token valid.
                        Solicită un link nou.
                    </p>
                )}

                {!success && (
                    <p className="auth-card__register">
                        <Link to="/forgot-password">
                            Solicită un link nou
                        </Link>
                    </p>
                )}
            </section>
        </main>
    );
}

export default ResetPasswordPage;