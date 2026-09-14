import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type WelcomeRewardType =
    | "NOTHING"
    | "POWDER"
    | "DISCOUNT_10"
    | "DISCOUNT_25"
    | "DISCOUNT_50"
    | "CASH_50"
    | "CASH_100"
    | "FREE_HAIRCUT";

interface WelcomeRewardStatusResponse {
    spinAvailable: boolean;
    reward: WelcomeRewardType | null;
    label: string | null;
}

interface WelcomeRewardResponse {
    reward: WelcomeRewardType;
    label: string;
}

interface WheelSegment {
    reward: WelcomeRewardType;
    label: string;
}

const segments: WheelSegment[] = [
    {
        reward: "NOTHING",
        label: "Nimic",
    },
    {
        reward: "DISCOUNT_10",
        label: "10% reducere",
    },
    {
        reward: "CASH_50",
        label: "50 lei",
    },
    {
        reward: "DISCOUNT_25",
        label: "25% reducere",
    },
    {
        reward: "POWDER",
        label: "O pudră",
    },
    {
        reward: "FREE_HAIRCUT",
        label: "Un tuns",
    },
    {
        reward: "CASH_100",
        label: "100 lei",
    },
    {
        reward: "DISCOUNT_50",
        label: "50% reducere",
    },
];

function WelcomeRewardPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] =
        useState<WelcomeRewardResponse | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const response =
                    await api.get<WelcomeRewardStatusResponse>(
                        "/rewards/me"
                    );

                if (!response.data.spinAvailable) {
                    navigate("/programare", {
                        replace: true,
                    });

                    return;
                }
            } catch {
                setError(
                    "Roata nu a putut fi încărcată."
                );
            } finally {
                setLoading(false);
            }
        };

        loadStatus();
    }, [navigate]);

    const handleSpin = async () => {
        if (spinning || result) {
            return;
        }

        setSpinning(true);
        setError("");

        try {
            const response =
                await api.post<WelcomeRewardResponse>(
                    "/rewards/spin"
                );

            const reward = response.data.reward;

            const segmentIndex = segments.findIndex(
                (segment) =>
                    segment.reward === reward
            );

            if (segmentIndex === -1) {
                throw new Error(
                    "Reward segment not found"
                );
            }

            const segmentAngle =
                360 / segments.length;

            const segmentCenter =
                segmentIndex * segmentAngle +
                segmentAngle / 2;

            const fullRotations = 360 * 7;

            const targetRotation =
                fullRotations +
                (360 - segmentCenter);

            setRotation(
                (current) =>
                    current + targetRotation
            );

            window.setTimeout(() => {
                setResult(response.data);
                setSpinning(false);
            }, 4800);
        } catch {
            setError(
                "Roata nu a putut fi învârtită. Încearcă din nou."
            );

            setSpinning(false);
        }
    };

    const handleContinue = () => {
        navigate("/programare", {
            replace: true,
        });
    };

    if (loading) {
        return (
            <main className="reward-page">
                <p className="reward-page__loading">
                    Se pregătește surpriza...
                </p>
            </main>
        );
    }

    return (
        <main className="reward-page">
            <section className="reward-card">
                <div className="reward-card__intro">
                    <p className="section-eyebrow">
                        BUN VENIT LA GLOBAL BARBER SOCIETY
                    </p>

                    <h1>
                        Învârte roata.
                    </h1>

                    <p>
                        Cont nou, o singură șansă.
                        Învârte roata și vezi ce ai câștigat.
                    </p>
                </div>

                <div className="reward-wheel-wrapper">
                    <div className="reward-wheel__pointer" />

                    <div
                        className="reward-wheel"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                        }}
                    >
                        {segments.map(
                            (segment, index) => {
                                const angle =
                                    index *
                                        (360 /
                                            segments.length) +
                                    360 /
                                        segments.length /
                                        2;

                                return (
                                    <div
                                        key={
                                            segment.reward
                                        }
                                        className="reward-wheel__label"
                                        style={{
                                            transform: `
                                                rotate(${angle}deg)
                                                translateY(-132px)
                                                rotate(${-angle}deg)
                                            `,
                                        }}
                                    >
                                        {
                                            segment.label
                                        }
                                    </div>
                                );
                            }
                        )}

                        <div className="reward-wheel__center">
                            GBS
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="reward-error">
                        {error}
                    </p>
                )}

                {!result && (
                    <button
                        type="button"
                        className="reward-spin-button"
                        onClick={handleSpin}
                        disabled={spinning}
                    >
                        {spinning
                            ? "Se învârte..."
                            : "ÎNVÂRTE ROATA"}
                    </button>
                )}

                {result && (
                    <div className="reward-result">
                        <p>
                            AI CÂȘTIGAT
                        </p>

                        <h2>
                            {result.label}
                        </h2>

                        <span>
                            Premiul a fost salvat în contul tău.
                        </span>

                        <button
                            type="button"
                            onClick={handleContinue}
                        >
                            Continuă la programare
                        </button>
                    </div>
                )}

                <p className="reward-card__notice">
                    Roata poate fi învârtită o singură dată pentru fiecare cont.
                </p>
            </section>
        </main>
    );
}

export default WelcomeRewardPage;
