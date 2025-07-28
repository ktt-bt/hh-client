import { useState, useEffect } from "react";
import {
    Routes,
    Route,
    Link,
    useNavigate,
    useLocation,
} from "react-router-dom";

import CategoriesPage from "@/pages/CategoriesPage";
import CustomersPage  from "@/pages/CustomersPage";
import InventoryPage  from "@/pages/InventoryPage";
import LoginPage  from "@/pages/LoginPage";
import OrdersPage  from "@/pages/OrdersPage";
import ProductsPage  from "@/pages/ProductsPage";
import ReportsPage  from "@/pages/ReportsPage";
import UserManagementPage  from "@/pages/UserManagementPage";

import { Button } from "./components/ui/button";
import {
    LogOut,
    Package,
    Tag,
    Users,
    BarChart,
    Home,
    Sun,
    Moon,
    UserCog,
} from "lucide-react";

const App = () => {
    const [authToken, setAuthToken] = useState(
        localStorage.getItem("authToken") || null,
    );
    const [currentUser, setCurrentUser] = useState(
        JSON.parse(localStorage.getItem("currentUser")) || null,
    );
    const navigate = useNavigate();
    const location = useLocation();

    // Dark Mode State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            return savedTheme === "dark";
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (!authToken && location.pathname !== "/login") {
            navigate("/login");
        } else if (authToken && location.pathname === "/login") {
            navigate("/products");
        }
    }, [authToken, navigate, location.pathname]);

    const handleLoginSuccess = (token, user) => {
        setAuthToken(token);
        setCurrentUser(user);
        localStorage.setItem("authToken", token);
        localStorage.setItem("currentUser", JSON.stringify(user));
        navigate("/products");
    };

    const handleLogout = () => {
        setAuthToken(null);
        setCurrentUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    const toggleDarkMode = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            {authToken && (
                <nav className="bg-gray-800 dark:bg-gray-950 text-white p-4 shadow-md flex justify-between items-center rounded-b-lg">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold">Inventory App</h1>
                        <div className="hidden md:flex space-x-4">
                            <Link
                                to="/products"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <Package className="mr-2 h-4 w-4" />{" "}
                                    Products
                                </Button>
                            </Link>
                            <Link
                                to="/categories"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <Tag className="mr-2 h-4 w-4" /> Categories
                                </Button>
                            </Link>
                            <Link
                                to="/inventory"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <Home className="mr-2 h-4 w-4" /> Inventory
                                </Button>
                            </Link>
                            <Link
                                to="/customers"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <Users className="mr-2 h-4 w-4" /> Customers
                                </Button>
                            </Link>
                            <Link
                                to="/orders"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <Package className="mr-2 h-4 w-4" /> Orders
                                </Button>
                            </Link>
                            <Link
                                to="/reports"
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                            >
                                <Button variant="ghost" className="text-white">
                                    <BarChart className="mr-2 h-4 w-4" />{" "}
                                    Reports
                                </Button>
                            </Link>
                            {currentUser && currentUser.role === "admin" && (
                                <Link
                                    to="/users"
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-800 text-white"
                                >
                                    <Button
                                        variant="ghost"
                                        className="text-white"
                                    >
                                        <UserCog className="mr-2 h-4 w-4" />{" "}
                                        User Mgmt
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {currentUser && (
                            <span className="text-sm">
                                Welcome, {currentUser.username} (
                                {currentUser.role})
                            </span>
                        )}

                        <Button
                            variant="ghost"
                            onClick={toggleDarkMode}
                            className="hover:bg-gray-700 dark:hover:bg-gray-800 text-white rounded-md"
                        >
                            {isDarkMode ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="hover:bg-red-700 dark:hover:bg-red-800 text-white rounded-md"
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                </nav>
            )}
            <main className="flex-grow p-4">
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <LoginPage onLoginSuccess={handleLoginSuccess} />
                        }
                    />
                    {authToken ? (
                        <>
                            <Route
                                path="/products"
                                element={<ProductsPage authToken={authToken} currentUser={currentUser}/>}
                            />
                            <Route
                                path="/categories"
                                element={<CategoriesPage authToken={authToken} currentUser={currentUser}/>}
                            />
                            <Route
                                path="/inventory"
                                element={
                                    <InventoryPage authToken={authToken} />
                                }
                            />
                            <Route
                                path="/customers"
                                element={
                                    <CustomersPage authToken={authToken} />
                                }
                            />
                            <Route
                                path="/orders"
                                element={<OrdersPage authToken={authToken} />}
                            />
                            <Route
                                path="/reports"
                                element={<ReportsPage authToken={authToken} />}
                            />
                            
                            {currentUser && currentUser.role === "admin" && (
                                <Route
                                    path="/users"
                                    element={
                                        <UserManagementPage
                                            authToken={authToken}
                                            currentUser={currentUser}
                                        />
                                    }
                                />
                            )}
                            <Route
                                path="/"
                                element={<ProductsPage authToken={authToken} />}
                            />
                        </>
                    ) : (
                        <Route
                            path="*"
                            element={
                                <LoginPage
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            }
                        />
                    )}
                </Routes>
            </main>
        </div>
    );
};

export default App;
