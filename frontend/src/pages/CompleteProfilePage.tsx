import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: "CLIENT" | "OWNER";
    active: boolean;
    createdAt: string;
}

function CompleteProfilePage() {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
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
            await api.put<UserResponse>(
                "/users/me/profile",
                {
                    phone: normalizedPhone,
                }
            );

            navigate("/programare", {
                replace: true,
            });
        } catch {
            setError(
                "Numărul nu a putut fi salvat. Este posibil să fie deja folosit."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="complete-profile-page">
            <section className="complete-profile-card">
                <p className="section-eyebrow">
                    APROAPE GATA
                </p>

                <h1>
                    Completează profilul.
                </h1>

                <p className="complete-profile-card__description">
                    Avem nevoie de numărul tău de telefon pentru
                    programări și pentru a putea fi contactat dacă
                    este nevoie.
                </p>

                <form
                    className="complete-profile-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Număr de telefon

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

                    {error && (
                        <p className="complete-profile-form__error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Se salvează..."
                            : "Continuă"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default CompleteProfilePage;