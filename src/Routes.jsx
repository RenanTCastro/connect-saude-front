import { createBrowserRouter } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Inventory from "./pages/Inventory/Inventory";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AppLayout from "./components/AppLayout/AppLayout";

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
            { path: "inventory", element: <Inventory /> },
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