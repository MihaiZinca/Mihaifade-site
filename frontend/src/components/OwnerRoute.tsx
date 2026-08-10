import { Navigate, Outlet } from "react-router-dom";
import { getRole, isAuthenticated } from "../services/auth";

function OwnerRoute() {
    if (!isAuthenticated()) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (getRole() !== "OWNER") {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
}

export default OwnerRoute;