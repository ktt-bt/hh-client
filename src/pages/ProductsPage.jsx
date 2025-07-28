import { useState, useEffect } from "react";
import {
    formatCurrency,
    formatQuantityWithUnitsDynamic,
    formatNumberOfBoxes,
    apiCall,
} from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Plus, Edit, Trash2 } from "lucide-react";

const ProductsPage = ({ authToken, currentUser }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newProduct, setNewProduct] = useState({
        product_name: "",
        category_id: "",
        description: "",
        base_price_per_gram: "",
        initial_stock_grams: "",
        unit_of_measure: "gram",
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedFilterCategoryId, setSelectedFilterCategoryId] =
        useState(""); // State for category filter

    useEffect(() => {
        // Initial fetch when component mounts or authToken changes
        fetchData(selectedFilterCategoryId);
    }, [authToken]);

    // Refetch data when filter category changes
    useEffect(() => {
        fetchData(selectedFilterCategoryId);
    }, [selectedFilterCategoryId]);

    // Function to fetch data, optionally with a category filter
    const fetchData = async (categoryId = "") => {
        setLoading(true);
        setError("");
        try {
            const productsUrl = categoryId
                ? `/products?category_id=${categoryId}`
                : "/products";
            const productsData = await apiCall(
                productsUrl,
                "GET",
                null,
                authToken,
            );
            setProducts(productsData);

            // Fetch categories for the filter and add/edit forms
            const categoriesData = await apiCall(
                "/categories",
                "GET",
                null,
                authToken,
            );
            setCategories(categoriesData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handler for general input changes in forms
    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (editingProduct) {
            setEditingProduct((prev) => ({
                ...prev,
                [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
            }));
        } else {
            setNewProduct((prev) => ({
                ...prev,
                [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
            }));
        }
    };

    // Handler for category selection in Add/Edit Product dialogs
    const handleProductCategorySelect = (value) => {
        if (editingProduct) {
            setEditingProduct((prev) => ({
                ...prev,
                category_id: parseInt(value),
            }));
        } else {
            setNewProduct((prev) => ({
                ...prev,
                category_id: parseInt(value),
            }));
        }
    };

    // Handler for unit of measure selection in Add/Edit Product dialogs
    const handleUnitOfMeasureSelect = (value) => {
        if (editingProduct) {
            setEditingProduct((prev) => ({ ...prev, unit_of_measure: value }));
        } else {
            setNewProduct((prev) => ({ ...prev, unit_of_measure: value }));
        }
    };

    // Handler for the main category filter dropdown
    const handleFilterCategoryChange = (value) => {
        // If "all" is selected, set to empty string to fetch all products
        setSelectedFilterCategoryId(value === "all" ? "" : value);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault(); setError("");
        try {
            await apiCall("/products", "POST", newProduct, authToken);
            setNewProduct({
                product_name: "",
                category_id: "",
                description: "",
                base_price_per_gram: "",
                initial_stock_grams: "",
                unit_of_measure: "gram",
            });
            setIsAddDialogOpen(false);
            fetchData(selectedFilterCategoryId); // Re-fetch with current filter
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditClick = (product) => {
        // Ensure category_id is a string for the Select component and is_active is boolean for checkbox
        setEditingProduct({
            ...product,
            category_id: product.category_id.toString(),
            is_active: product.is_active === 1,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await apiCall(`/products/${editingProduct.product_id}`, "PUT",
                {
                    ...editingProduct,
                    category_id: parseInt(editingProduct.category_id), // Convert back to number for API
                    is_active: editingProduct.is_active ? 1 : 0,
                },
                authToken,
            );
            setEditingProduct(null); setIsEditDialogOpen(false);
            fetchData(selectedFilterCategoryId); // Re-fetch with current filter
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("Are you sure you want to soft-delete this product? It will be marked inactive.")) {
            setError("");
            try {
                await apiCall(`/products/${productId}`, "DELETE", null, authToken);
                fetchData(selectedFilterCategoryId); // Re-fetch with current filter
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading)
        return (
            <div className="text-center p-4 text-gray-700 dark:text-gray-300">Loading products...</div>
        );
    if (error)
        return (
            <div className="text-center p-4 text-red-500">Error: {error}</div>
        );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Products</h2>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Add New Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                Add Product
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct} className="flex flex-wrap gap-4 py-4">
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="product_name" className="text-gray-700 dark:text-gray-300">Name</Label>
                                <Input id="product_name" value={newProduct.product_name} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="category_id" className="text-gray-700 dark:text-gray-300">Category</Label>
                                <Select onValueChange={handleProductCategorySelect} value={newProduct.category_id.toString()}>
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                                                {cat.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="unit_of_measure" className="text-gray-700 dark:text-gray-300">
                                    Unit of Measure
                                </Label>
                                <Select onValueChange={handleUnitOfMeasureSelect} value={newProduct.unit_of_measure}>
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        <SelectItem value="gram">gram</SelectItem>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="piece">piece</SelectItem>
                                        <SelectItem value="roll">roll</SelectItem>
                                        <SelectItem value="box">box</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full">
                                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                                <Textarea id="description" value={newProduct.description} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="base_price_per_gram" className="text-gray-700 dark:text-gray-300">
                                    Base Price (per selected unit)
                                </Label>
                                <Input id="base_price_per_gram" type="number" step="1"
                                    value={newProduct.base_price_per_gram} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required
                                />
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="initial_stock_grams" className="text-gray-700 dark:text-gray-300">
                                    Initial Stock (in selected unit)
                                </Label>
                                <Input id="initial_stock_grams" type="number" step="1" value={newProduct.initial_stock_grams}
                                    onChange={handleInputChange} className="w-full dark:bg-gray-700 dark:text-gray-50"
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm w-full text-center">{error}</p>
                            )}
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                                Add Product
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Category Filter */}
                <div className="flex-grow sm:flex-grow-0 w-full sm:w-1/3">
                    <Label htmlFor="category_filter" className="sr-only">Filter by Category</Label>
                    <Select onValueChange={handleFilterCategoryChange} value={selectedFilterCategoryId}>
                        <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                            {/* Value changed from "" to "all" to satisfy SelectItem value prop requirement */}
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                                    {cat.category_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Edit Product Dialog */}
            {editingProduct && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                Edit Product
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProduct} className="flex flex-wrap gap-4 py-4">
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="product_name" className="text-gray-700 dark:text-gray-300">Name</Label>
                                <Input id="product_name" value={editingProduct.product_name} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="category_id" className="text-gray-700 dark:text-gray-300">Category</Label>
                                <Select onValueChange={handleProductCategorySelect} value={editingProduct.category_id.toString()}>
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        { categories.map((cat) => (
                                            <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                                                {cat.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="unit_of_measure" className="text-gray-700 dark:text-gray-300">
                                    Unit of Measure
                                </Label>
                                <Select onValueChange={handleUnitOfMeasureSelect} value={editingProduct.unit_of_measure}>
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        <SelectItem value="gram">gram</SelectItem>
                                        <SelectItem value="piece">piece</SelectItem>
                                        <SelectItem value="roll">roll</SelectItem>
                                        <SelectItem value="box">box</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full">
                                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                                <Textarea id="description" value={editingProduct.description} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="base_price_per_gram" className="text-gray-700 dark:text-gray-300">
                                    Base Price (per selected unit)
                                </Label>
                                <Input id="base_price_per_gram" type="number" step="1"
                                    value={editingProduct.base_price_per_gram} onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50" required/>
                            </div>

                            { currentUser.role !== "admin" || (<div className="flex items-center space-x-2 mt-4">
                                <Checkbox id="is_active" checked={editingProduct.is_active}
                                    onCheckedChange={(checked) =>
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
                            </div>) }

                            {error && (
                                <p className="text-red-500 text-sm w-full text-center">
                                    {error}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                                Update Product
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">Product Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Category</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Description</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Price/Unit</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Current Stock</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Number of Boxes</TableHead>
                        { currentUser.role !== "admin" || 
                            (<TableHead className="text-gray-700 dark:text-gray-200">Active</TableHead>)}
                        <TableHead className="text-gray-700 dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.product_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                {product.product_name}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{product.category_name}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{product.description}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                                { formatCurrency(product.base_price_per_gram)}/
                                {product.unit_of_measure}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                                { formatQuantityWithUnitsDynamic(
                                    product.current_stock,
                                    product.unit_of_measure,
                                )}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                                { formatNumberOfBoxes(
                                    product.number_of_boxes,
                                    product.category_id,
                                    product.unit_of_measure,
                                )}
                            </TableCell>
                            { currentUser.role !== "admin" || (<TableCell className="text-gray-700 dark:text-gray-300">
                                {product.is_active === 1 ? "Yes" : "No"}
                            </TableCell>)}
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}
                                        className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" 
                                        onClick={() => handleDeleteProduct(product.product_id)}
                                        className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900">
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

export default ProductsPage;
