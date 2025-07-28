import { useState, useEffect } from "react";

import { apiCall } from "@/utils/formatters"; 
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    
} from "@/components/ui/dialog";
import {
    Plus,
    Edit,
    Trash2,
} from "lucide-react";

const CategoriesPage = ({ authToken, currentUser }) => {
    console.log(currentUser);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newCategory, setNewCategory] = useState({
        category_name: "",
        description: "",
    });
    const [editingCategory, setEditingCategory] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => { fetchData(); }, [authToken]);

    const fetchData = async () => {
        setLoading(true); setError("");
        try {
            const categoriesData = await apiCall("/categories", "GET", null, authToken);
            setCategories(categoriesData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (editingCategory) {
            setEditingCategory((prev) => ({
                ...prev,
                [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
            }));
        } else {
            setNewCategory((prev) => ({ ...prev, [id]: value }));
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault(); setError("");
        try {
            await apiCall("/categories", "POST", newCategory, authToken);
            setNewCategory({ category_name: "", description: "" }); setIsAddDialogOpen(false); fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditClick = (category) => {
        setEditingCategory({
            ...category,
            is_active: category.is_active === 1,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault(); setError("");
        try {
            await apiCall(
                `/categories/${editingCategory.category_id}`, "PUT",
                {
                    ...editingCategory,
                    is_active: editingCategory.is_active ? 1 : 0,
                },
                authToken,
            );
            setEditingCategory(null); setIsEditDialogOpen(false); fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm("Are you sure you want to soft-delete this category? It will be marked inactive.")) {
            setError("");
            try {
                await apiCall(`/categories/${categoryId}`, "DELETE", null, authToken, ); fetchData();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading)
        return ( <div className="text-center p-4 text-gray-700 dark:text-gray-300">Loading categories...</div>);
    if (error)
        return ( <div className="text-center p-4 text-red-500">Error: {error}</div> );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Categories</h2>

            {/* Add Category Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Add New Category
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Add Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="flex flex-wrap gap-4 py-4">
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="category_name" className="text-gray-700 dark:text-gray-300" >Name</Label>
                            <Input id="category_name" value={newCategory.category_name} onChange={handleInputChange} className="w-full dark:bg-gray-700 dark:text-gray-50" required
                            />
                        </div>
                        <div className="w-full">
                            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                            <Textarea id="description" value={newCategory.description} onChange={handleInputChange} className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                        </div>
                        {error && ( <p className="text-red-500 text-sm w-full text-center">{error}</p>)}
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                            Add Category
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            {editingCategory && (
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                >
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Edit Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateCategory} className="flex flex-wrap gap-4 py-4">
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="category_name" className="text-gray-700 dark:text-gray-300">Name</Label>
                                <Input id="category_name" value={editingCategory.category_name} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                            </div>
                            <div className="w-full">
                                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                                <Textarea id="description" value={editingCategory.description} onChange={handleInputChange} className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            { currentUser && currentUser.role === "admin" && (<div className="flex items-center space-x-2 mt-4">
                                <Checkbox id="is_active" checked={editingCategory.is_active}
                                    onCheckedChange={(checked) => handleInputChange({target: { id: "is_active", type: "checkbox", checked }})}/>
                                <Label htmlFor="is_active" className="text-gray-700 dark:text-gray-300">Active</Label>
                            </div>)}
                            {error && ( <p className="text-red-500 text-sm w-full text-center">{error}</p> )}
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                                Update Category
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">Category Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Description</TableHead>
                        { currentUser && currentUser.role === "admin" &&  (<TableHead className="text-gray-700 dark:text-gray-200">Active</TableHead>)}
                        <TableHead className="text-gray-700 dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.category_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-50">{category.category_name}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{category.description}</TableCell>
                            { currentUser && currentUser.role === "admin" &&  (<TableCell className="text-gray-700 dark:text-gray-300">{category.is_active === 1 ? "Yes" : "No"}</TableCell>)}
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(category)} className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.category_id)} className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900">
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

export default CategoriesPage;