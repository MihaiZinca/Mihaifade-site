import { Navigate, Outlet } from "react-router-dom";
import {
    getRole,
    isAuthenticated,
} from "../services/auth";

function BarberRoute() {
    if (!isAuthenticated()) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const role = getRole();

    if (
        role !== "BARBER" &&
        role !== "OWNER"
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
}

export default BarberRoute;