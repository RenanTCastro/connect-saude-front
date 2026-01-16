import { createBrowserRouter } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Inventory from "./pages/Inventory/Inventory";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
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
            { index: true, element: <ProtectedRoute><CashFlow/></ProtectedRoute>},
            { path: "inventory", element: <ProtectedRoute><Inventory /></ProtectedRoute>},
            { path: "patient", element: <ProtectedRoute><Patients /></ProtectedRoute>},
            { path: "patient/:id", element: <ProtectedRoute><Patient /></ProtectedRoute>},
            { path: "sales", element: <ProtectedRoute><SalesCRM /></ProtectedRoute>},
            { path: "appointment", element: <ProtectedRoute><Appointment /></ProtectedRoute>},
            { path: "settings", element: <ProtectedRoute><Settings /></ProtectedRoute>},
            { path: "*", element: <ProtectedRoute><>Página não encontrada</></ProtectedRoute> },
        ],
    },
    {
        path: "*", 
        element: <>ERRO</>,
    },
]);

export default router;