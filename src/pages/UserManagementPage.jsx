import { useState, useEffect } from "react";
import { apiCall } from "@/utils/formatters"; 
import {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogTrigger, 
    DialogHeader, 
    DialogFooter, 
} from '@/components/ui/dialog'; 

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Plus, Trash2, Eye, Save, XCircle,  Edit} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// --- User Management Page Component (Admin Only) ---
const UserManagementPage = ({ authToken, currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        email: "",
        role: "user",
        first_name: "",
        last_name: "",
    });
    const [editingUser, setEditingUser] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role === "admin") {
            fetchData();
        } else {
            setError("Access denied. Admin role required.");
            setLoading(false);
        }
    }, [authToken, currentUser]);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const usersData = await apiCall("/users", "GET", null, authToken);
            setUsers(usersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (editingUser) {
            setEditingUser((prev) => ({
                ...prev,
                [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
            }));
        } else {
            setNewUser((prev) => ({ ...prev, [id]: value }));
        }
    };

    const handleRoleSelect = (value) => {
        if (editingUser) {
            setEditingUser((prev) => ({ ...prev, role: value }));
        } else {
            setNewUser((prev) => ({ ...prev, role: value }));
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await apiCall("/users", "POST", newUser, authToken);
            setNewUser({
                username: "",
                password: "",
                email: "",
                role: "user",
                first_name: "",
                last_name: "",
            });
            setIsAddDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser({
            ...user,
            is_active: user.is_active === 1,
            password: "",
        }); // Clear password for security
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const updatePayload = { ...editingUser };
            if (updatePayload.password === "") {
                delete updatePayload.password; // Don't send empty password if not changed
            }
            await apiCall(
                `/users/${editingUser.user_id}`,
                "PUT",
                {
                    ...updatePayload,
                    is_active: editingUser.is_active ? 1 : 0,
                },
                authToken,
            );
            setEditingUser(null);
            setIsEditDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            setError("");
            try {
                await apiCall(`/users/${userId}`, "DELETE", null, authToken); fetchData();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading)
        return (
            <div className="text-center p-4 text-gray-700 dark:text-gray-300">Loading users...</div>
        );
    if (error)
        return (
            <div className="text-center p-4 text-red-500">Error: {error}</div>
        );

    if (currentUser.role !== "admin") {
        return (
            <div className="text-center p-4 text-red-500">You do not have permission to view this page.</div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">
                User Management
            </h2>

            {/* Add User Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Add New User
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Add New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="flex flex-wrap gap-4 py-4">
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                            <Input id="username" value={newUser.username} onChange={handleInputChange} required
                                className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                            <Input id="email" type="email" value={newUser.email} onChange={handleInputChange} required
                                className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                            <Input id="password" type="password" value={newUser.password} onChange={handleInputChange}
                                className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">Role</Label>
                            <Select onValueChange={handleRoleSelect} value={newUser.role}>
                                <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="first_name" className="text-gray-700 dark:text-gray-300">First Name</Label>
                            <Input id="first_name" value={newUser.first_name} onChange={handleInputChange}
                                className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="last_name" className="text-gray-700 dark:text-gray-300">Last Name</Label>
                            <Input id="last_name" value={newUser.last_name} onChange={handleInputChange}
                                className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm w-full text-center">
                                {error}
                            </p>
                        )}
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                            Add User
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            {editingUser && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Edit User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateUser} className="flex flex-wrap gap-4 py-4">
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                                <Input id="username" value={editingUser.username} onChange={handleInputChange} required
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                                <Input id="email" type="email" value={editingUser.email} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                    New Password (leave blank to keep current)
                                </Label>
                                <Input id="password" type="password" value={editingUser.password} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">Role</Label>
                                <Select onValueChange={handleRoleSelect} value={editingUser.role}>
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="first_name" className="text-gray-700 dark:text-gray-300">First Name</Label>
                                <Input id="first_name" value={editingUser.first_name} onChange={handleInputChange} className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="last_name" className="text-gray-700 dark:text-gray-300">Last Name</Label>
                                <Input id="last_name" value={editingUser.last_name} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex items-center space-x-2 mt-4">
                                <Checkbox id="is_active" checked={editingUser.is_active} onCheckedChange={(checked) =>
                                        handleInputChange({
                                            target: {
                                                id: "is_active",
                                                type: "checkbox",
                                                checked,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="is_active" className="text-gray-700 dark:text-gray-300">Active</Label>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm w-full text-center">
                                    {error}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                                Update User
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">Username</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Email</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Role</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Active</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.user_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-50">{user.username}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{user.email}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{user.role}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{user.first_name} {user.last_name}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                                {user.is_active === 1 ? "Yes" : "No"}
                            </TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}
                                        className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.user_id)} className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default UserManagementPage;
