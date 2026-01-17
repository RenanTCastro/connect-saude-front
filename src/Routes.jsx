import { createBrowserRouter } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Inventory from "./pages/Inventory/Inventory";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard/SubscriptionGuard";
import AppLayout from "./components/AppLayout/AppLayout";
import Patients from "./pages/Patients/Patients";
import Patient from "./pages/Patient/Patient";
import SalesCRM from "./pages/SalesCRM/SalesCRM";
import Appointment from "./pages/Appointment/Appointment";
import CashFlow from "./pages/CashFlow/CashFlow";
import Settings from "./pages/Settings/Settings";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <ProtectedRoute><SubscriptionGuard><CashFlow/></SubscriptionGuard></ProtectedRoute>},
            { path: "inventory", element: <ProtectedRoute><SubscriptionGuard><Inventory /></SubscriptionGuard></ProtectedRoute>},
            { path: "patient", element: <ProtectedRoute><SubscriptionGuard><Patients /></SubscriptionGuard></ProtectedRoute>},
            { path: "patient/:id", element: <ProtectedRoute><SubscriptionGuard><Patient /></SubscriptionGuard></ProtectedRoute>},
            { path: "sales", element: <ProtectedRoute><SubscriptionGuard><SalesCRM /></SubscriptionGuard></ProtectedRoute>},
            { path: "appointment", element: <ProtectedRoute><SubscriptionGuard><Appointment /></SubscriptionGuard></ProtectedRoute>},
            { path: "settings", element: <ProtectedRoute><Settings /></ProtectedRoute>},
            { path: "*", element: <ProtectedRoute><SubscriptionGuard><>Página não encontrada</></SubscriptionGuard></ProtectedRoute> },
        ],
    },
    {
        path: "*", 
        element: <>ERRO</>,
    },
]);

export default router;