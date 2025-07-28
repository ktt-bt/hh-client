import { useState, useEffect, useRef } from "react";
import {
    formatNumberOfBoxes,
    formatQuantityWithUnitsDynamic,
    apiCall,
} from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

import { Plus, Edit, Trash2 } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const InventoryPage = ({ authToken }) => {
    const [inventory, setInventory] = useState([]);
    const [stockMovements, setStockMovements] = useState([]);
    const [products, setProducts] = useState([]); // All products fetched from API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newMovement, setNewMovement] = useState({
        product_id: "",
        movement_type: "restock",
        change_in_grams: "",
        reason: "",
    });
    const [editingMovement, setEditingMovement] = useState(null);

    const [isAddMovementDialogOpen, setIsAddMovementDialogOpen] =
        useState(false);
    const [isEditMovementDialogOpen, setIsEditMovementDialogOpen] =
        useState(false);

    // Filter states for Current Inventory Levels table
    const [inventoryFilter, setInventoryFilter] = useState({
        productName: "",
        fromDate: "",
        toDate: "",
    });
    const [debouncedInventoryProductName, setDebouncedInventoryProductName] =
        useState("");

    // Filter states for Recent Stock Movements table
    const [stockMovementFilter, setStockMovementFilter] = useState({
        productName: "",
        fromDate: "",
        toDate: "",
    });
    const [
        debouncedStockMovementProductName,
        setDebouncedStockMovementProductName,
    ] = useState("");

    // New states for integrated product search/selection within movement dialogs
    const [dialogProductSearchQuery, setDialogProductSearchQuery] =
        useState("");
    const [filteredProductsForDialog, setFilteredProductsForDialog] = useState(
        [],
    );
    const [showProductSuggestions, setShowProductSuggestions] = useState(false); // To control dropdown visibility

    // Ref for the product search input in the dialog
    const productSearchInputRef = useRef(null);

    // Debounce for Inventory Product Name Filter
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedInventoryProductName(inventoryFilter.productName);
        }, 500);
        return () => clearTimeout(handler);
    }, [inventoryFilter.productName]);

    // Debounce for Stock Movement Product Name Filter
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedStockMovementProductName(
                stockMovementFilter.productName,
            );
        }, 500);
        return () => clearTimeout(handler);
    }, [stockMovementFilter.productName]);

    // Effect to filter products for the dialog based on dialogProductSearchQuery
    useEffect(() => {
        if (dialogProductSearchQuery) {
            setFilteredProductsForDialog(
                products.filter((prod) =>
                    prod.product_name
                        .toLowerCase()
                        .includes(dialogProductSearchQuery.toLowerCase()),
                ),
            );
        } else {
            setFilteredProductsForDialog(products);
        }
    }, [dialogProductSearchQuery, products]);

    useEffect(() => {
        fetchData();
    }, [
        authToken,
        debouncedInventoryProductName,
        inventoryFilter.fromDate,
        inventoryFilter.toDate,
        debouncedStockMovementProductName,
        stockMovementFilter.fromDate,
        stockMovementFilter.toDate,
    ]);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            // Build query parameters for Inventory
            const inventoryParams = new URLSearchParams();
            if (debouncedInventoryProductName)
                inventoryParams.append(
                    "product_name",
                    debouncedInventoryProductName,
                );
            if (inventoryFilter.fromDate)
                inventoryParams.append("from_date", inventoryFilter.fromDate);
            if (inventoryFilter.toDate)
                inventoryParams.append("to_date", inventoryFilter.toDate);

            // Fetch Inventory Data
            const inventoryResponse = await apiCall(
                `/inventory?${inventoryParams.toString()}`,
                "GET",
                null,
                authToken,
            );
            if (
                !inventoryResponse ||
                !Array.isArray(inventoryResponse.inventory)
            ) {
                console.error(
                    "API returned invalid data format for inventory:",
                    inventoryResponse,
                );
                setInventory([]);
                setError(
                    "Received invalid data format for inventory. Please check backend response.",
                );
                return;
            }
            setInventory(inventoryResponse.inventory);

            // Build query parameters for Stock Movements
            const stockMovementParams = new URLSearchParams();
            if (debouncedStockMovementProductName)
                stockMovementParams.append(
                    "product_name",
                    debouncedStockMovementProductName,
                );
            if (stockMovementFilter.fromDate)
                stockMovementParams.append(
                    "from_date",
                    stockMovementFilter.fromDate,
                );
            if (stockMovementFilter.toDate)
                stockMovementParams.append(
                    "to_date",
                    stockMovementFilter.toDate,
                );

            // Fetch Stock Movements Data (using a separate call to its dedicated endpoint)
            const movementsData = await apiCall(
                `/stock-movements?${stockMovementParams.toString()}`,
                "GET",
                null,
                authToken,
            );
            if (!Array.isArray(movementsData)) {
                console.error(
                    "API returned non-array for stock movements:",
                    movementsData,
                );
                setStockMovements([]);
                setError(
                    "Received invalid data format for stock movements. Please check backend response.",
                );
                return;
            }
            setStockMovements(movementsData);

            // Fetch all products (for the dialog's search/select)
            const productsData = await apiCall(
                "/products",
                "GET",
                null,
                authToken,
            );
            if (!Array.isArray(productsData)) {
                console.error(
                    "API returned non-array for products:",
                    productsData,
                );
                setProducts([]);
                setError(
                    "Received invalid data format for products. Please check backend response.",
                );
                return;
            }
            setProducts(productsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (editingMovement) {
            setEditingMovement((prev) => ({
                ...prev,
                [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
            }));
        } else {
            setNewMovement((prev) => ({ ...prev, [id]: value }));
        }
    };

    const handleSelectChange = (id, value) => {
        // This is primarily for the Movement Type select, not product
        if (editingMovement) {
            setEditingMovement((prev) => ({ ...prev, [id]: value }));
        } else {
            setNewMovement((prev) => ({ ...prev, [id]: value }));
        }
    };

    // Handler for selecting a product from the custom search dropdown in dialog
    const handleProductSelectFromSearch = (product) => {
        if (editingMovement) {
            setEditingMovement((prev) => ({
                ...prev,
                product_id: product.product_id,
            }));
        } else {
            setNewMovement((prev) => ({
                ...prev,
                product_id: product.product_id,
            }));
        }
        setDialogProductSearchQuery(product.product_name); // Set input text to selected product name
        setShowProductSuggestions(false); // Hide suggestions
    };

    // Handle typing in the product search input in dialog
    const handleDialogProductSearchInputChange = (e) => {
        setDialogProductSearchQuery(e.target.value);
        setShowProductSuggestions(true); // Show suggestions when typing
        // Also clear selected product_id if the user starts typing again
        if (editingMovement) {
            setEditingMovement((prev) => ({ ...prev, product_id: "" }));
        } else {
            setNewMovement((prev) => ({ ...prev, product_id: "" }));
        }
    };

    // Handle blur on dialog search input (with a small delay to allow click on suggestions)
    const handleDialogProductSearchBlur = () => {
        setTimeout(() => {
            setShowProductSuggestions(false);
        }, 200); // Small delay
    };

    const handleAddMovement = async (e) => {
        e.preventDefault();
        setError("");

        const targetProductId = newMovement.product_id;
        if (!targetProductId) {
            setError("Please select a product.");
            productSearchInputRef.current?.focus();
            return;
        }

        try {
            await apiCall(
                "/stock-movements",
                "POST",
                {
                    ...newMovement,
                    product_id: parseInt(targetProductId),
                    change_in_grams: parseFloat(newMovement.change_in_grams),
                },
                authToken,
            );
            setNewMovement({
                product_id: "",
                movement_type: "restock",
                change_in_grams: "",
                reason: "",
            });
            setDialogProductSearchQuery(""); // Clear search query on successful add
            setIsAddMovementDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditMovementClick = (movement) => {
        const product = products.find(
            (p) => p.product_id === movement.product_id,
        );
        if (product) {
            setDialogProductSearchQuery(product.product_name);
        } else {
            setDialogProductSearchQuery("");
        }
        setEditingMovement({
            ...movement,
            is_active: movement.is_active === 1,
        });
        setIsEditMovementDialogOpen(true);
    };

    const handleUpdateMovement = async (e) => {
        e.preventDefault();
        setError("");

        const targetProductId = editingMovement.product_id;
        if (!targetProductId) {
            setError("Please select a product.");
            return;
        }

        try {
            await apiCall(
                `/stock-movements/${editingMovement.movement_id}`,
                "PUT",
                {
                    ...editingMovement,
                    product_id: parseInt(targetProductId),
                    change_in_grams: parseFloat(
                        editingMovement.change_in_grams,
                    ),
                    is_active: editingMovement.is_active ? 1 : 0,
                },
                authToken,
            );
            setEditingMovement(null);
            setDialogProductSearchQuery(""); // Clear search query on successful update
            setIsEditMovementDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteMovement = async (movementId) => {
        if (
            window.confirm(
                "WARNING: Soft-deleting this stock movement will NOT automatically adjust inventory. You must manually record a compensating adjustment if needed. Are you sure you want to proceed?",
            )
        ) {
            setError("");
            try {
                await apiCall(
                    `/stock-movements/${movementId}`,
                    "DELETE",
                    null,
                    authToken,
                );
                fetchData();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    // Handlers for Inventory Filters
    const handleInventoryFilterChange = (e) => {
        const { id, value } = e.target;
        setInventoryFilter((prev) => ({ ...prev, [id]: value }));
    };

    // Handlers for Stock Movement Filters
    const handleStockMovementFilterChange = (e) => {
        const { id, value } = e.target;
        setStockMovementFilter((prev) => ({ ...prev, [id]: value }));
    };

    if (loading)
        return (
            <div className="text-center p-4 text-gray-700 dark:text-gray-300">
                Loading inventory...
            </div>
        );
    if (error)
        return (
            <div className="text-center p-4 text-red-500">Error: {error}</div>
        );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">
                Inventory & Stock Movements
            </h2>

            <Dialog
                open={isAddMovementDialogOpen}
                onOpenChange={(open) => {
                    setIsAddMovementDialogOpen(open);
                    if (!open) {
                        setNewMovement({
                            product_id: "",
                            movement_type: "restock",
                            change_in_grams: "",
                            reason: "",
                        });
                        setDialogProductSearchQuery("");
                        setError("");
                        setShowProductSuggestions(false);
                    } else {
                        setTimeout(() => {
                            productSearchInputRef.current?.focus();
                        }, 100);
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button className="mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Record New Stock
                        Movement
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                            Record Stock Movement
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleAddMovement}
                        className="flex flex-wrap gap-4 py-4"
                    >
                        {/* Integrated Product Search/Selection for Add Movement */}
                        <div className="flex-1 min-w-[280px] relative">
                            <Label
                                htmlFor="product_id_search_input"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                Product
                            </Label>
                            <Input
                                id="product_id_search_input"
                                type="text"
                                placeholder="Type to search and select product..."
                                value={dialogProductSearchQuery}
                                onChange={handleDialogProductSearchInputChange}
                                onFocus={() => setShowProductSuggestions(true)}
                                onBlur={handleDialogProductSearchBlur}
                                className="w-full dark:bg-gray-700 dark:text-gray-50"
                                ref={productSearchInputRef}
                            />
                            {showProductSuggestions &&
                                filteredProductsForDialog.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                        {filteredProductsForDialog.map(
                                            (prod) => (
                                                <Button
                                                    key={prod.product_id}
                                                    type="button" // Important to prevent form submission
                                                    onClick={() =>
                                                        handleProductSelectFromSearch(
                                                            prod,
                                                        )
                                                    }
                                                    className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none"
                                                    variant="ghost"
                                                >
                                                    {prod.product_name}{" "}
                                                    (Current:{" "}
                                                    {parseFloat(
                                                        prod.current_stock || 0,
                                                    ).toFixed(0)}{" "}
                                                    {prod.unit_of_measure})
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                )}
                            {/* Display selected product or error message if not selected */}
                            {newMovement.product_id ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Selected:{" "}
                                    {
                                        products.find(
                                            (p) =>
                                                p.product_id ===
                                                newMovement.product_id,
                                        )?.product_name
                                    }
                                </p>
                            ) : dialogProductSearchQuery &&
                              !filteredProductsForDialog.length ? (
                                <p className="text-xs text-red-500 mt-1">
                                    No matching products found.
                                </p>
                            ) : (
                                <p className="text-xs text-red-500 mt-1">
                                    Please select a product from the list.
                                </p>
                            )}
                        </div>

                        <div className="flex-1 min-w-[280px]">
                            <Label
                                htmlFor="movement_type"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                Movement Type
                            </Label>
                            <Select
                                onValueChange={(val) =>
                                    handleSelectChange("movement_type", val)
                                }
                                value={newMovement.movement_type}
                            >
                                <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                    <SelectItem value="restock">
                                        Restock
                                    </SelectItem>
                                    <SelectItem value="sale">
                                        Sale Deduction
                                    </SelectItem>
                                    <SelectItem value="wastage">
                                        Wastage
                                    </SelectItem>
                                    <SelectItem value="adjustment">
                                        Adjustment
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label
                                htmlFor="change_in_grams"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                Change (grams)
                            </Label>
                            <Input
                                id="change_in_grams"
                                type="number"
                                step="1"
                                value={newMovement.change_in_grams}
                                onChange={handleInputChange}
                                className="w-full dark:bg-gray-700 dark:text-gray-50"
                                required
                            />
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label
                                htmlFor="reason"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                Reason
                            </Label>
                            <Textarea
                                id="reason"
                                value={newMovement.reason}
                                onChange={handleInputChange}
                                className="w-full dark:bg-gray-700 dark:text-gray-50"
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm w-full text-center">
                                {error}
                            </p>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4"
                        >
                            Record Movement
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Stock Movement Dialog */}
            {editingMovement && (
                <Dialog
                    open={isEditMovementDialogOpen}
                    onOpenChange={(open) => {
                        setIsEditMovementDialogOpen(open);
                        if (!open) {
                            setEditingMovement(null);
                            setDialogProductSearchQuery("");
                            setError("");
                            setShowProductSuggestions(false);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                Edit Stock Movement
                            </DialogTitle>
                        </DialogHeader>
                        <p className="text-red-500 text-sm mb-4">
                            WARNING: Editing/Deleting stock movements will NOT
                            automatically adjust inventory. You must manually
                            record a compensating adjustment if needed.
                        </p>
                        <form
                            onSubmit={handleUpdateMovement}
                            className="flex flex-wrap gap-4 py-4"
                        >
                            {/* Integrated Product Search/Selection for Edit */}
                            <div className="flex-1 min-w-[280px] relative">
                                <Label
                                    htmlFor="product_id_search_input_edit"
                                    className="text-gray-700 dark:text-gray-300"
                                >
                                    Product
                                </Label>
                                <Input
                                    id="product_id_search_input_edit"
                                    type="text"
                                    placeholder="Type to search and select product..."
                                    value={dialogProductSearchQuery}
                                    onChange={
                                        handleDialogProductSearchInputChange
                                    }
                                    onFocus={() =>
                                        setShowProductSuggestions(true)
                                    }
                                    onBlur={handleDialogProductSearchBlur}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"
                                />
                                {showProductSuggestions &&
                                    filteredProductsForDialog.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                            {filteredProductsForDialog.map(
                                                (prod) => (
                                                    <Button
                                                        key={prod.product_id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleProductSelectFromSearch(
                                                                prod,
                                                            )
                                                        }
                                                        className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none"
                                                        variant="ghost"
                                                    >
                                                        {prod.product_name}{" "}
                                                        (Current:{" "}
                                                        {parseFloat(
                                                            prod.current_stock ||
                                                                0,
                                                        ).toFixed(0)}{" "}
                                                        {prod.unit_of_measure})
                                                    </Button>
                                                ),
                                            )}
                                        </div>
                                    )}
                                {/* Display selected product or error */}
                                {editingMovement.product_id ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Selected:{" "}
                                        {
                                            products.find(
                                                (p) =>
                                                    p.product_id ===
                                                    editingMovement.product_id,
                                            )?.product_name
                                        }
                                    </p>
                                ) : dialogProductSearchQuery &&
                                  !filteredProductsForDialog.length ? (
                                    <p className="text-xs text-red-500 mt-1">
                                        No matching products found.
                                    </p>
                                ) : (
                                    <p className="text-xs text-red-500 mt-1">
                                        Please select a product from the list.
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 min-w-[280px]">
                                <Label
                                    htmlFor="movement_type"
                                    className="text-gray-700 dark:text-gray-300"
                                >
                                    Movement Type
                                </Label>
                                <Select
                                    onValueChange={(val) =>
                                        handleSelectChange("movement_type", val)
                                    }
                                    value={editingMovement.movement_type}
                                >
                                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        <SelectItem value="restock">
                                            Restock
                                        </SelectItem>
                                        <SelectItem value="sale">
                                            Sale Deduction
                                        </SelectItem>
                                        <SelectItem value="wastage">
                                            Wastage
                                        </SelectItem>
                                        <SelectItem value="adjustment">
                                            Adjustment
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label
                                    htmlFor="change_in_grams"
                                    className="text-gray-700 dark:text-gray-300"
                                >
                                    Change (grams)
                                </Label>
                                <Input
                                    id="change_in_grams"
                                    type="number"
                                    step="1"
                                    value={editingMovement.change_in_grams}
                                    onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"
                                    required
                                />
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label
                                    htmlFor="reason"
                                    className="text-gray-700 dark:text-gray-300"
                                >
                                    Reason
                                </Label>
                                <Textarea
                                    id="reason"
                                    value={editingMovement.reason}
                                    onChange={handleInputChange}
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"
                                />
                            </div>
                            {/*<div className="flex items-center space-x-2 mt-4">
                                <Checkbox
                                    id="is_active"
                                    checked={editingMovement.is_active}
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
                                <Label
                                    htmlFor="is_active"
                                    className="text-gray-700 dark:text-gray-300"
                                >
                                    Active
                                </Label>
                            </div>*/}
                            {error && (
                                <p className="text-red-500 text-sm w-full text-center">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4"
                            >
                                Update Movement
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-50">
                Current Inventory Levels
            </h3>
            {/* Inventory Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex-1 min-w-[200px]">
                    <Label
                        htmlFor="productName"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        Product Name
                    </Label>
                    <Input
                        id="productName"
                        type="text"
                        placeholder="Filter by product name..."
                        value={inventoryFilter.productName}
                        onChange={handleInventoryFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <div className="flex-1 min-w-[180px]">
                    <Label
                        htmlFor="fromDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        From Date (Last Restock)
                    </Label>
                    <Input
                        id="fromDate"
                        type="date"
                        value={inventoryFilter.fromDate}
                        onChange={handleInventoryFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <div className="flex-1 min-w-[180px]">
                    <Label
                        htmlFor="toDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        To Date (Last Restock)
                    </Label>
                    <Input
                        id="toDate"
                        type="date"
                        value={inventoryFilter.toDate}
                        onChange={handleInventoryFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
            </div>

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Product Name
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Category
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Current Stock
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Number of Boxes
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Last Restock
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan="4"
                                className="text-center text-gray-500 dark:text-gray-400"
                            >
                                No inventory data available for the selected
                                filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        inventory.map((item) => {
                            return (
                                <TableRow
                                    key={item.inventory_id}
                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                        {item.product_name}
                                    </TableCell>
                                    <TableCell className="text-gray-700 dark:text-gray-300">
                                        {item.category_name}
                                    </TableCell>
                                    <TableCell className="text-gray-700 dark:text-gray-300">
                                        {formatQuantityWithUnitsDynamic(
                                            item.current_stock,
                                            item.unit_of_measure,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-700 dark:text-gray-300">
                                        {formatNumberOfBoxes(
                                            item.number_of_boxes,
                                            item.category_id,
                                            item.unit_of_measure,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-700 dark:text-gray-300">
                                        {item.last_movement_date
                                            ? new Date(
                                                  item.last_movement_date,
                                              ).toLocaleDateString()
                                            : "N/A"}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
                Recent Stock Movements
            </h3>
            {/* Stock Movements Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex-1 min-w-[200px]">
                    <Label
                        htmlFor="productName"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        Product Name
                    </Label>
                    <Input
                        id="productName"
                        type="text"
                        placeholder="Filter by product name..."
                        value={stockMovementFilter.productName}
                        onChange={handleStockMovementFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <div className="flex-1 min-w-[180px]">
                    <Label
                        htmlFor="fromDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        From Date
                    </Label>
                    <Input
                        id="fromDate"
                        type="date"
                        value={stockMovementFilter.fromDate}
                        onChange={handleStockMovementFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <div className="flex-1 min-w-[180px]">
                    <Label
                        htmlFor="toDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        To Date
                    </Label>
                    <Input
                        id="toDate"
                        type="date"
                        value={stockMovementFilter.toDate}
                        onChange={handleStockMovementFilterChange}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
            </div>
            <p className="text-red-500 text-sm mb-4">
                WARNING: Editing or soft-deleting historical stock movements
                below will NOT automatically adjust the current inventory. You
                must manually record compensating adjustments if needed.
            </p>
            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Product
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Type
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Change
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Reason
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Date
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            By User
                        </TableHead>
                        {/*<TableHead className="text-gray-700 dark:text-gray-200">
                            Active
                        </TableHead>*/}
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stockMovements.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan="8"
                                className="text-center text-gray-500 dark:text-gray-400"
                            >
                                No stock movements recorded for the selected
                                filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        stockMovements.map((movement) => (
                            <TableRow
                                key={movement.movement_id}
                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                    {movement.product_name}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {movement.movement_type}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {formatQuantityWithUnitsDynamic(
                                        movement.change_in_grams,
                                        movement.unit_of_measure,
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {movement.reason}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {new Date(
                                        movement.movement_date,
                                    ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {movement.moved_by_user}
                                </TableCell>
                                {/*<TableCell className="text-gray-700 dark:text-gray-300">
                                    {movement.is_active === 1 ? "Yes" : "No"}
                                </TableCell>*/}
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleEditMovementClick(
                                                    movement,
                                                )
                                            }
                                            className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteMovement(
                                                    movement.movement_id,
                                                )
                                            }
                                            className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default InventoryPage;
