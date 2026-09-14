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
}

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post<LoginResponse>(
                "/auth/login",
                {
                    email,
                    password,
                }
            );

            saveAuth(
                response.data.token,
                response.data.role
            );

            if (response.data.role === "OWNER") {
                navigate("/admin");
                return;
            }

            if (response.data.role === "BARBER") {
                navigate("/barber");
                return;
            }

            navigate("/programare");
        } catch {
            setError("Email sau parolă incorectă.");
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
                    CONT CLIENT
                </p>

                <h1>
                    Intră în cont.
                </h1>

                <p className="auth-card__description">
                    Autentifică-te pentru a putea face și administra
                    programările tale.
                </p>

                <GoogleLoginButton />

                <div className="auth-divider">
                    <span>sau</span>
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
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
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
                                setPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    <div className="auth-card__forgot-password">
                        <Link to="/forgot-password">
                            Ai uitat parola?
                        </Link>
                    </div>

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
                            ? "Se conectează..."
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
