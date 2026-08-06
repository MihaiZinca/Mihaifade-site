import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveToken } from "../services/auth";

interface GoogleAuthResponse {
    token: string;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "CLIENT" | "OWNER";
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

            saveToken(response.data.token);

            if (response.data.role === "OWNER") {
                navigate("/admin");
                return;
            }

            navigate("/programare");
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