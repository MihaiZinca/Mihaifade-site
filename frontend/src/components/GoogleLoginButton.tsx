import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth } from "../services/auth";

interface GoogleAuthResponse {
    token: string;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "CLIENT" | "OWNER";
    requiresProfileCompletion: boolean;
}

interface WelcomeRewardStatusResponse {
    spinAvailable: boolean;
    reward: string | null;
    label: string | null;
}

function GoogleLoginButton() {
    const navigate = useNavigate();

    const handleSuccess = async (
        credentialResponse: { credential?: string }
    ) => {
        if (!credentialResponse.credential) {
            return;
        }

        try {
            const response = await api.post<GoogleAuthResponse>(
                "/auth/google",
                {
                    credential: credentialResponse.credential,
                }
            );

            saveAuth(response.data.token,response.data.role);

            if (response.data.role === "OWNER") {
                navigate("/admin", {
                    replace: true,
                });

                return;
            }

            if (response.data.requiresProfileCompletion) {
                navigate("/complete-profile", {
                    replace: true,
                });

                return;
            }

            const rewardResponse =
                await api.get<WelcomeRewardStatusResponse>(
                    "/rewards/me"
                );

            if (rewardResponse.data.spinAvailable) {
                navigate("/welcome-reward", {
                    replace: true,
                });

                return;
            }

            navigate("/programare", {
                replace: true,
            });
        } catch {
            alert("Autentificarea cu Google a eșuat.");
        }
    };

    return (
        <div className="google-login">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                    alert("Autentificarea cu Google a eșuat.");
                }}
                theme="filled_black"
                size="large"
                shape="rectangular"
                text="continue_with"
                width="420"
            />
        </div>
    );
}

export default GoogleLoginButton;