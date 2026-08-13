import { BrowserRouter, Route, Routes } from "react-router-dom";
import BarberRoute from "./components/BarberRoute.tsx";
import OwnerRoute from "./components/OwnerRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import BarberPage from "./pages/BarberPage";
import BookingPage from "./pages/BookingPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WelcomeRewardPage from "./pages/WelcomeRewardPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<HomePage />}
                />

                <Route
                    path="/contact"
                    element={<ContactPage />}
                />

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/register"
                    element={<RegisterPage />}
                />

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/complete-profile"
                        element={<CompleteProfilePage />}
                    />

                    <Route
                        path="/welcome-reward"
                        element={<WelcomeRewardPage />}
                    />

                    <Route
                        path="/programare"
                        element={<BookingPage />}
                    />

                    <Route
                        path="/cont"
                        element={<AccountPage />}
                    />
                </Route>

                <Route element={<OwnerRoute />}>
                    <Route
                        path="/admin"
                        element={<AdminPage />}
                    />
                </Route>

                <Route element={<BarberRoute />}>
                    <Route
                        path="/barber"
                        element={<BarberPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;