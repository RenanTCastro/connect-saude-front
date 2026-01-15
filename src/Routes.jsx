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
            { path: "inventory", element: <Inventory />},
            { path: "patient", element: <Patients />},
            { path: "patient/:id", element: <Patient />},
            { path: "sales", element: <SalesCRM />},
            { path: "appointment", element: <Appointment />},
            { path: "cashflow", element: <CashFlow />},
            { path: "home", element: <ProtectedRoute><>Página inicial</></ProtectedRoute>},
            { path: "*", element: <>ERRO</> },
        ],
    },
    {
        path: "*", 
        element: <>ERRO</>,
    },
]);

export default router;