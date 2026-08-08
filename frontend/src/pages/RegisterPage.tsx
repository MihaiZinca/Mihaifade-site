import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";
import api from "../services/api";
import { saveToken } from "../services/auth";

interface RegisterResponse {
    token: string;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "CLIENT" | "OWNER";
    requiresProfileCompletion: boolean;
}

function RegisterPage() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");

        const normalizedPhone = phone.replace(/\s/g, "");

        if (!/^07\d{8}$/.test(normalizedPhone)) {
            setError(
                "Introdu un număr valid de telefon, de forma 07xxxxxxxx."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post<RegisterResponse>(
                "/auth/register",
                {
                    firstName,
                    lastName,
                    email,
                    phone: normalizedPhone,
                    password,
                }
            );

            saveToken(response.data.token);

            if (response.data.role === "OWNER") {
                navigate("/admin");
                return;
            }

            navigate("/welcome-reward", {
                replace: true,
            });
        } catch {
            setError(
                "Contul nu a putut fi creat. Verifică datele introduse."
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