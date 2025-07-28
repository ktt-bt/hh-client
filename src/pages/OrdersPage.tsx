import { useState, useEffect } from "react";
import {
    formatNumberWithCommas,
    formatCurrency,
    apiCall,
} from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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

import { Plus, Trash2, Eye, Save, XCircle } from "lucide-react";

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

const OrdersPage = ({ authToken }) => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]); // All customers fetched, for new order creation dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
    const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [currentOrderStatus, setCurrentOrderStatus] = useState(""); // State for status in view dialog

    // States for new order form
    const [newOrder, setNewOrder] = useState({
        customer_id: null, // Can be null for guest orders
        delivery_method: "pickup",
        customer_phone_at_order: "",
        shipping_address_at_order: "",
        shipping_cost: "0",
        status: "processing", // Added status with a default value
        items: [],
    });
    const [newItem, setNewItem] = useState({
        product_id: "",
        purchased_item_quantity: "",
        price_per_gram: "", // This will hold the product's base price when selected
        is_gift: false, 
    });

    // States for product search in New Order Dialog (used for adding items to order)
    const [ productSearchQuery, setProductSearchQuery ] = useState("");
    const [ filteredProductsForNewOrder, setFilteredProductsForNewOrder ] =  useState([]);
    const [showProductSearchResults, setShowProductSearchResults ] =useState(false);

    // NEW States for Customer Search IN New Order Dialog (for selecting a customer for the new order)
    const [ newOrderCustomerSearchQuery, setNewOrderCustomerSearchQuery ] =  useState("");
    const [
        filteredCustomersForNewOrderDialog,
        setFilteredCustomersForNewOrderDialog,
    ] = useState([]);
    const [
        showNewOrderCustomerSearchResults,
        setShowNewOrderCustomerSearchResults,
    ] = useState(false);

    // States for Customer Filter in Orders Table (the one next to "Create New Order" button)
    const [ filterCustomerSearchQuery, setFilterCustomerSearchQuery ] = useState(""); // Text typed in filter search box
    const [
        debouncedFilterCustomerSearchQuery,
        setDebouncedFilterCustomerSearchQuery,
    ] = useState(""); // Debounced value
    const [
        filteredCustomersForFilterSuggestions,
        setFilteredCustomersForFilterSuggestions,
    ] = useState([]); // Customers matching filter query
    const [ showFilterCustomerSuggestions, setShowFilterCustomerSuggestions ] = useState(false); // Visibility of filter suggestions
    const [ selectedCustomerIdForFilter, setSelectedCustomerIdForFilter ] =  useState(""); // The actual customer_id used for filtering orders
    const [
        selectedCustomerFilterDisplayName,
        setSelectedCustomerFilterDisplayName,
    ] = useState(""); // Name to display next to filter input

     // NEW STATES FOR DELETE CONFIRMATION MODAL
    const [ isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen ] = useState(false);
    const [ orderToDeleteId, setOrderToDeleteId ] = useState(null);

    // Effect to fetch initial data for orders, products, and customers
    useEffect(() => { fetchData(); }, [ selectedCustomerIdForFilter, authToken ] );

    // Debounce effect for customer filter search input (main table filter)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilterCustomerSearchQuery(filterCustomerSearchQuery);
        }, 500); // 500ms debounce delay
        return () => { clearTimeout(handler); };
    }, [ filterCustomerSearchQuery ]);

    // Effect to fetch customers for filter suggestions based on debounced search query (main table filter)
    useEffect(() => {
        const fetchCustomersForFilter = async () => {
            if (debouncedFilterCustomerSearchQuery) {
                try {
                    const customersData = await apiCall(
                        `/customers?name=${debouncedFilterCustomerSearchQuery}`, "GET", null, authToken );
                    setFilteredCustomersForFilterSuggestions(customersData);
                } catch (err) {
                    console.error("Error fetching customers for filter:", err.message );
                    setFilteredCustomersForFilterSuggestions([]);
                }
            } else {
                setFilteredCustomersForFilterSuggestions([]); // Clear suggestions if search query is empty
            }
        };
        fetchCustomersForFilter();
    }, [debouncedFilterCustomerSearchQuery, authToken]);

    // Effect to filter products for new order dialog based on productSearchQuery
    useEffect(() => {
        if (productSearchQuery) {
            setFilteredProductsForNewOrder(
                products.filter((prod) =>
                    prod.product_name
                        .toLowerCase()
                        .includes(productSearchQuery.toLowerCase()),
                ),
            );
        } else {
            setFilteredProductsForNewOrder(products); // Show all if search is empty
        }
    }, [productSearchQuery, products]);

    // NEW: Effect to filter customers for New Order Dialog based on newOrderCustomerSearchQuery
    useEffect(() => {
        if (newOrderCustomerSearchQuery) {
            setFilteredCustomersForNewOrderDialog(
                allCustomers.filter(
                    (cust) =>
                        cust.name
                            .toLowerCase()
                            .includes(newOrderCustomerSearchQuery.toLowerCase()) || (cust.phone_number &&
                            cust.phone_number.includes(newOrderCustomerSearchQuery)),
                ),
            );
        } else {
            setFilteredCustomersForNewOrderDialog(allCustomers); // Show all if search is empty
        }
    }, [newOrderCustomerSearchQuery, allCustomers]);

    // When selectedOrder changes (for View Order Details dialog), set initial status
    useEffect(() => {
        if (selectedOrder) {
            setCurrentOrderStatus(selectedOrder.status);
        }
    }, [selectedOrder]);

    // Function to fetch all necessary data from backend
    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (selectedCustomerIdForFilter) {
                params.append("customer_id", selectedCustomerIdForFilter);
            }

            const ordersData = await apiCall(`/orders?${params.toString()}`, "GET", null, authToken);
            setOrders(ordersData);

            const productsData = await apiCall("/products", "GET", null, authToken);
            setProducts(productsData);

            const customersData = await apiCall("/customers", "GET", null, authToken);
            setAllCustomers(customersData);
        } catch (err) { setError(err.message); 
        } finally { setLoading(false); }
    };

    // Handler for regular input changes in new order form (for newOrder state)
    const handleNewOrderInputChange = (e) => {
        const { id, value } = e.target;
        setNewOrder((prev) => ({ ...prev, [id]: value }));
    };

    // Handler for Select components in new order dialog (e.g., Delivery Method, Status)
    const handleSelectChange = (id, value) => {
        setNewOrder((prev) => ({ ...prev, [id]: value }));
    };

    // Handler for product search input change in new order dialog (for adding items to order)
    const handleProductSearchInputChange = (e) => {
        setProductSearchQuery(e.target.value);
        setShowProductSearchResults(true); // Show results when typing
    };

    // Handler when a product is selected from search results in new order dialog
    const handleProductSelect = (product) => {
        setNewItem((prev) => ({
            ...prev,
            product_id: product.product_id,
            price_per_gram: parseFloat(product.base_price_per_gram),
            is_gift: false, // Reset is_gift when a new product is selected
        }));
        setProductSearchQuery(product.product_name); // Display selected product's name
        setShowProductSearchResults(false); // Hide results
    };

    // Handler for new item input changes (for newItem state)
    const handleNewItemInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        setNewItem((prev) => ({
            ...prev, [id]: type === "checkbox" ? checked : value
        }));
    };

    const handleAddItemToOrder = () => {
        setError(""); // Clear previous errors first

        if (!newItem.product_id) {
            setError("Please select a product from the search results before adding an item.");
            return;
        }
        if ( !newItem.purchased_item_quantity ||
            parseFloat(newItem.purchased_item_quantity) <= 0
        ) {
            setError("Please enter a valid quantity/weight for the selected product (must be greater than zero)."); return;
        }
        if (isNaN(parseFloat(newItem.price_per_gram))) {
            setError("The price per unit for the selected product is invalid. Please check product details."); return;
        }

        const product = products.find((p) => p.product_id === newItem.product_id);
        if (!product) {
            setError("Selected product not found in the system. Please try re-selecting or adding it via the Products page."); return;
        }

        // Calculate line item total: if it's a gift, price is 0 for this calculation
        const effectivePriceForCalculation = newItem.is_gift ? 0 : parseFloat(newItem.price_per_gram);
        const lineItemTotal = parseFloat(newItem.purchased_item_quantity) * effectivePriceForCalculation;

        setNewOrder((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    ...newItem,
                    product_name: product.product_name,
                    unit_of_measure: product.unit_of_measure, // Store unit for display
                    line_item_total: lineItemTotal,
                },
            ],
        }));

        // Reset item form
        setNewItem({
            product_id: "",
            purchased_item_quantity: "",
            price_per_gram: "",
            is_gift: false,
        });
        setProductSearchQuery(""); // Clear product search after adding item
        setError(""); // Clear error after successful add
    };

    const handleRemoveItemFromOrder = (index) => {
        setNewOrder((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setError("");

        if (newOrder.items.length === 0) {
            setError("Order must contain at least one item."); return;
        }

        const totalAmount = newOrder.items.reduce((sum, item) => sum + item.line_item_total, 0);
        const finalShippingCost = parseFloat(newOrder.shipping_cost);
        const finalTotalAmount = totalAmount + finalShippingCost;

        try {
            await apiCall(
                "/orders",
                "POST",
                {
                    ...newOrder,
                    total_amount: finalTotalAmount.toFixed(2),
                    shipping_cost: finalShippingCost.toFixed(2),
                    customer_id: newOrder.customer_id, // customer_id can be null for guest orders
                    status: newOrder.status, // Include the selected status
                    order_items: newOrder.items.map((item) => ({
                        product_id: item.product_id,
                        stock_change: parseFloat(item.purchased_item_quantity),
                        price_per_gram: parseFloat(item.price_per_gram), // Send actual price
                        is_gift: item.is_gift ? 1 : 0, // Send as 0 or 1
                    })),
                },
                authToken,
            );

            // Reset order form
            setNewOrder({
                customer_id: null,
                delivery_method: "pickup",
                customer_phone_at_order: "",
                shipping_address_at_order: "",
                shipping_cost: "0.00",
                status: "processing", // Reset status to default
                items: [],
            });
            setProductSearchQuery(""); // Clear product search in dialog
            setNewOrderCustomerSearchQuery(""); // Clear customer search in dialog
            setIsAddOrderDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewOrderClick = (order) => {
        setSelectedOrder(order);
        setIsViewOrderDialogOpen(true);
    };

    const handleStatusUpdate = async () => {
        setError("");
        if (!selectedOrder || !currentOrderStatus) {
            setError("No order selected or status not set."); return;
        }

        try {
            await apiCall(
                `/orders/${selectedOrder.order_id}/status`,
                "PUT",
                { status: currentOrderStatus },
                authToken
            ); 
            setIsViewOrderDialogOpen(false); // Close dialog on success
            fetchData(); // Re-fetch orders to show updated status
        } catch (err) { setError(err.message); }
    };

    //  This function now just opens the confirmation dialog
    const handleDeleteOrder = (orderId) => {
        setOrderToDeleteId(orderId); // Store the ID of the order to be deleted
        setIsDeleteConfirmDialogOpen(true); // Open the confirmation dialog
    };

    // NEW: This function performs the actual deletion after confirmation
    const handleConfirmDelete = async () => {
        setError('');
        if (!orderToDeleteId) {
            setError('No order selected for deletion.');
            setIsDeleteConfirmDialogOpen(false); // Close dialog
            return;
        }

        try {
            await apiCall(`/orders/${orderToDeleteId}`, "DELETE", null, authToken);
            fetchData(); // Re-fetch data to reflect the deletion
            setOrderToDeleteId(null); // Clear the stored ID
            setIsDeleteConfirmDialogOpen(false); // Close the dialog
        } catch (err) {
            setError(err.message);
        }
    };

    // Handlers for Customer Filter in Orders Table (next to "Create New Order" button)
    const handleFilterCustomerSearchInputChange = (e) => {
        setFilterCustomerSearchQuery(e.target.value);
        setShowFilterCustomerSuggestions(true);
        // Clear selected customer if user starts typing a new query
        setSelectedCustomerIdForFilter("");
        setSelectedCustomerFilterDisplayName("");
    };

    const handleFilterCustomerSelect = (customer) => {
        setSelectedCustomerIdForFilter(customer.customer_id.toString());
        setSelectedCustomerFilterDisplayName(
            `${customer.name} (${customer.phone_number || "N/A"})`,
        );
        setFilterCustomerSearchQuery(customer.name); // Keep selected name in search box
        // setShowFilterCustomerSuggestions(false); // Hide suggestions
    };

    const handleClearCustomerFilter = () => {
        setFilterCustomerSearchQuery("");
        setDebouncedFilterCustomerSearchQuery("");
        setSelectedCustomerIdForFilter("");
        setSelectedCustomerFilterDisplayName("");
        setFilteredCustomersForFilterSuggestions([]);
    };

    // Close suggestions on blur if not clicking a suggestion (for main table filter)
    const handleFilterCustomerBlur = () => {
        // A small delay allows click events on suggestions to register before hiding
        setTimeout(() => {
            setShowFilterCustomerSuggestions(false);
        }, 300);
    };

    // Handlers for Customer Search in New Order Dialog
    const handleNewOrderCustomerSearchInputChange = (e) => {
        setNewOrderCustomerSearchQuery(e.target.value);
        setShowNewOrderCustomerSearchResults(true);
        // Clear selected customer_id if user starts typing a new query
        if (newOrder.customer_id !== null) {
            setNewOrder((prev) => ({ ...prev, customer_id: null }));
        }
    };

    const handleNewOrderCustomerSelect = (customer) => {
        setNewOrder((prev) => ({ ...prev, customer_id: customer.customer_id }));
        setNewOrderCustomerSearchQuery(customer.name); // Set input to selected customer's name
        setShowNewOrderCustomerSearchResults(false);
    };

    const handleNewOrderGuestSelect = () => {
        setNewOrder((prev) => ({ ...prev, customer_id: null }));
        setNewOrderCustomerSearchQuery("Guest Order");
        setShowNewOrderCustomerSearchResults(false);
    };

    // Close suggestions on blur for new order customer search
    const handleNewOrderCustomerSearchBlur = () => {
        setTimeout(() => {
            setShowNewOrderCustomerSearchResults(false);
        }, 200);
    };

    if (loading)
        return (
            <div className="text-center p-4 text-gray-700 dark:text-gray-300">
                Loading orders...
            </div>
        );
    if (error)
        return (
            <div className="text-center p-4 text-red-500">Error: {error}</div>
        );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Orders</h2>

            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen} >
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> Create New Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                Create New Order
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateOrder} className="flex flex-col gap-4 py-4">
                            {/* Customer Search Section for New Order Form */}
                            <div className="flex flex-col gap-2 relative">
                                <Label htmlFor="customer_search" className="text-gray-700 dark:text-gray-300">
                                    Customer (Search or select Guest)
                                </Label>
                                <Input id="customer_search" type="text" placeholder="Search customer by name or phone..."
                                    value={newOrderCustomerSearchQuery}
                                    onChange={ handleNewOrderCustomerSearchInputChange }
                                    // onFocus={() => setShowNewOrderCustomerSearchResults(true)}
                                    onBlur={ handleNewOrderCustomerSearchBlur } // Use the new dedicated blur handler
                                    className="w-full dark:bg-gray-700 dark:text-gray-50"
                                />
                                { showNewOrderCustomerSearchResults && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-12">
                                        <Button type="button"
                                            className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none" variant="ghost"
                                            onClick={handleNewOrderGuestSelect} // Use new dedicated guest select
                                        >
                                            Guest Order (No customer selected)
                                        </Button>
                                        {filteredCustomersForNewOrderDialog.length > 0
                                            ?   filteredCustomersForNewOrderDialog.map(
                                                    (customer) => (
                                                        <Button key={customer.customer_id} type="button" variant="ghost"
                                                            className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none"
                                                            onClick={() => handleNewOrderCustomerSelect(customer)} // Use new dedicated customer select
                                                        >
                                                        { customer.name} ({customer.phone_number || "No Phone"})
                                                        </Button>
                                                    ),
                                                )   : newOrderCustomerSearchQuery.length > 0 && ( // Only show "No matching" if something typed
                                                        <div className="p-2 text-gray-500 dark:text-gray-400">
                                                            No matching customers found.
                                                        </div>
                                                    )}
                                    </div>
                                )}
                                {/* Display selected customer name or "Guest Order" */}
                                { newOrder.customer_id === null ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Selected: Guest Order</p>
                                        ) : (   <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Selected Customer:{" "}
                                        { allCustomers.find((c) => c.customer_id === newOrder.customer_id)?.name }
                                    </p>    )
                                }
                            </div>

                            {/* Delivery Method and Order Status */}
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[280px]">
                                    <Label htmlFor="delivery_method" className="text-gray-700 dark:text-gray-300">Delivery Method</Label>
                                    <Select id="delivery_method"
                                        onValueChange={(value) => handleSelectChange("delivery_method", value)}
                                        value={newOrder.delivery_method} required >
                                        <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                            <SelectItem value="pickup">Pickup</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[280px]">
                                    <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">
                                        Order Status
                                    </Label>
                                    <Select id="status" onValueChange={(value) => handleSelectChange("status", value)}
                                        value={newOrder.status} required >
                                        <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            { newOrder.delivery_method === "shipped" && (
                                <div className="flex-1 min-w-[280px]">
                                    <Label htmlFor="shipping_cost" className="text-gray-700 dark:text-gray-300">Shipping Cost</Label>
                                    <Input id="shipping_cost" type="number" step="1" value={newOrder.shipping_cost} onChange={handleNewOrderInputChange}
                                        className="w-full dark:bg-gray-700 dark:text-gray-50"/>
                                </div>
                            )}

                            { newOrder.delivery_method === "pickup" && (
                                <div className="w-full">
                                    <Label htmlFor="customer_phone_at_order" className="text-gray-700 dark:text-gray-300">
                                        Customer Phone (for pickup)
                                    </Label>
                                    <Input id="customer_phone_at_order" value={newOrder.customer_phone_at_order}
                                        onChange={handleNewOrderInputChange}
                                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                                        required={ newOrder.delivery_method === "pickup" }/>
                                </div>
                            )}

                            { newOrder.delivery_method === "shipped" && (
                                <div className="w-full">
                                    <Label htmlFor="shipping_address_at_order"
                                        className="text-gray-700 dark:text-gray-300">Shipping Address
                                    </Label>
                                    <Textarea id="shipping_address_at_order"
                                        value={ newOrder.shipping_address_at_order }
                                        onChange={handleNewOrderInputChange}
                                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                                        required={ newOrder.delivery_method === "shipped" }
                                    />
                                </div>
                            )}

                            {/* Order Items Section */}
                            <h3 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-50">Order Items</h3>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="product_search" className="text-gray-700 dark:text-gray-300" >
                                    Search Product
                                </Label>
                                <div className="relative">
                                    <Input id="product_search" type="text" placeholder="Search product by name..."
                                        value={productSearchQuery} onChange={handleProductSearchInputChange}
                                        onFocus={() => setShowProductSearchResults(true)}
                                        onBlur={() => setTimeout(() => setShowProductSearchResults(false), 200)} 
                                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                                    />
                                    { showProductSearchResults && productSearchQuery.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                                { filteredProductsForNewOrder.length > 0 ? (
                                                    filteredProductsForNewOrder.map( (product) => (
                                                            <Button key={ product.product_id } type="button" variant="ghost"
                                                                className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none"
                                                                onClick={() => handleProductSelect(product)} >
                                                                { product.product_name }{" "}
                                                                ({formatCurrency(product.base_price_per_gram)}
                                                                /
                                                                {product.unit_of_measure}
                                                                ) - Stock:{" "}
                                                                {formatNumberWithCommas(
                                                                    product.current_stock_current_stock,
                                                                    0,
                                                                )}{" "}
                                                                {product.unit_of_measure}
                                                            </Button>
                                                        ),
                                                    )
                                                ) : (   <div className="p-2 text-gray-500 dark:text-gray-400">No matching products found. </div>
                                                )}
                                            </div>
                                        )}
                                </div>
                                <div className="flex flex-wrap gap-4 items-end mt-2">
                                    <div className="flex-1 min-w-[150px]">
                                        <Label htmlFor="purchased_item_quantity" className="text-gray-700 dark:text-gray-300">
                                            Quantity (
                                            { products.find(
                                                (p) => p.product_id === newItem.product_id, 
                                                )?.unit_of_measure || "g"
                                            })
                                        </Label>
                                        <Input id="purchased_item_quantity" type="number" step="1" 
                                            value={ newItem.purchased_item_quantity } onChange={handleNewItemInputChange}
                                            className="w-full dark:bg-gray-700 dark:text-gray-50"
                                            disabled={!newItem.product_id}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <Label htmlFor="price_per_gram" className="text-gray-700 dark:text-gray-300">
                                            Price Per Unit
                                        </Label>
                                        <Input id="price_per_gram" type="number" step="1" value={newItem.price_per_gram}
                                            onChange={handleNewItemInputChange} 
                                            className="w-full dark:bg-gray-700 dark:text-gray-50"
                                            disabled={ !newItem.product_id || newItem.is_gift } 
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0 mb-1">
                                        <Checkbox id="is_gift" checked={newItem.is_gift} 
                                            onCheckedChange={ (checked) => handleNewItemInputChange({ target: { id: "is_gift", type: "checkbox", checked }})
                                            } disabled={!newItem.product_id} />
                                        <Label htmlFor="is_gift" className="text-gray-700 dark:text-gray-300 text-sm">
                                            Mark as Gift (No Revenue)
                                        </Label>
                                    </div>
                                    <Button type="button" onClick={handleAddItemToOrder} 
                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-md flex-shrink-0"
                                        disabled={ !newItem.product_id || !newItem.purchased_item_quantity } > Add Item
                                    </Button>
                                </div>
                            </div>

                            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mt-4">
                                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                                    <TableRow>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Product</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Quantity</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Price/Unit</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Total</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Gift?</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Remove</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {newOrder.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan="6" className="text-center text-gray-500 dark:text-gray-400">
                                                No items added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        newOrder.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="text-gray-900 dark:text-gray-50">
                                                    {item.product_name}
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-gray-300">
                                                    {formatNumberWithCommas(item.purchased_item_quantity, 0)}{" "}
                                                    {item.unit_of_measure}
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-gray-300">
                                                    {formatCurrency(item.price_per_gram)}
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-gray-300">
                                                    {formatCurrency(item.line_item_total)}
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-gray-300">
                                                    {item.is_gift ? "Yes" : "No"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm"
                                                        onClick={() => handleRemoveItemFromOrder(index)}
                                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900" >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <p className="text-right text-lg font-bold text-gray-900 dark:text-gray-50">
                                Subtotal:{" "}
                                {formatCurrency(newOrder.items.reduce((sum, item) => sum + item.line_item_total, 0))}
                            </p>
                            <p className="text-right text-lg font-bold text-gray-900 dark:text-gray-50">
                                Shipping:{" "}{formatCurrency(newOrder.shipping_cost)}
                            </p>
                            <p className="text-right text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                Total Order:{" "}
                                {   formatCurrency(newOrder.items.reduce((sum, item) => sum + item.line_item_total, 0) 
                                    + parseFloat(newOrder.shipping_cost))
                                }
                            </p>

                            { error && (<p className="text-red-500 text-sm w-full text-center">{error}</p> ) }
                            <Button type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">
                                Create Order
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Customer Filter for Orders Table */}
                <div className="flex-1 min-w-[280px] relative">
                    <Label htmlFor="customer_filter_search" className="text-gray-700 dark:text-gray-300">
                        Filter by Customer
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input id="customer_filter_search" type="text" placeholder="Search customer name ..."
                            value={filterCustomerSearchQuery} onChange={handleFilterCustomerSearchInputChange}
                            onBlur={ handleFilterCustomerBlur } className="flex-grow dark:bg-gray-700 dark:text-gray-50"
                            // onFocus={ () => setShowFilterCustomerSuggestions(true) }
                        />
                        { filterCustomerSearchQuery && (
                            <Button
                                variant="ghost" size="icon" onClick={handleClearCustomerFilter}
                                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900" >
                                <XCircle className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    { showFilterCustomerSuggestions && filteredCustomersForFilterSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                { filteredCustomersForFilterSuggestions.map(
                                    (cust) => (
                                        <Button
                                            key={cust.customer_id} type="button" variant="ghost"
                                            onClick={() =>handleFilterCustomerSelect(cust)}
                                            className="w-full text-left justify-start p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-none"                                            
                                        >{cust.name} ({cust.phone_number || "N/A"})
                                        </Button>
                                    ),
                                )}
                            </div>
                    )}

                    { selectedCustomerFilterDisplayName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Selected:{" "}<span className="font-medium">{selectedCustomerFilterDisplayName}</span>
                        </p> 
                    )}

                    { filterCustomerSearchQuery && !selectedCustomerIdForFilter && !filteredCustomersForFilterSuggestions.length && (
                        <p className="text-sm text-red-500 mt-1">No matching customers found for filter.</p> )
                    }
                </div>
            </div>

            {/* View Order Details Dialog */}
            {selectedOrder && (
                <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen} >
                    <DialogContent className="sm:max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                Order #{selectedOrder.order_id} Details
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 py-4 text-gray-700 dark:text-gray-300">
                            <p><strong>Date:</strong>{" "}{ new Date(selectedOrder.order_date).toLocaleDateString("vi-VN") }</p>
                            <p><strong>Customer:</strong>{" "}{selectedOrder.customer_name || "Guest"}</p>
                            <div className="flex items-center gap-2">
                                <p><strong>Status:</strong></p>
                                {/* Status dropdown, editable only if not completed/cancelled */}
                                <Select onValueChange={setCurrentOrderStatus} value={currentOrderStatus} 
                                    disabled={
                                        selectedOrder.status === "completed" ||
                                        selectedOrder.status === "cancelled"
                                    }>
                                    <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:text-gray-50">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                                        <SelectItem value="processing"> Processing </SelectItem>
                                        <SelectItem value="completed"> Completed </SelectItem>
                                        <SelectItem value="cancelled"> Cancelled </SelectItem>
                                    </SelectContent>
                                </Select>
                                { selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                                    <Button onClick={handleStatusUpdate} size="sm"
                                        className="ml-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm" >
                                        <Save className="h-4 w-4 mr-1"/>Update
                                    </Button>
                                )}
                            </div>
                            <p>
                                <strong>Payment Method:</strong>{" "}{selectedOrder.payment_method}
                            </p>
                            <p>
                                <strong>Delivery Method:</strong>{" "}{selectedOrder.delivery_method}
                            </p>
                            {selectedOrder.delivery_method === "shipped" && (
                                <>
                                    <p><strong>Shipping Cost:</strong>{" "}{ formatCurrency( selectedOrder.shipping_cost) }</p>
                                    <p><strong>Shipping Address:</strong>{" "}{ selectedOrder.shipping_address_at_order }</p>
                                </>
                            )}
                            { selectedOrder.delivery_method === "pickup" && (
                                <p><strong>Customer Phone:</strong>{" "}{selectedOrder.customer_phone_at_order}</p>
                            )}
                            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
                                Total Amount:{" "}{formatCurrency(selectedOrder.total_amount)}
                            </p>

                            <h3 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-50">Items</h3>
                            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                                    <TableRow>
                                        <TableHead className="text-gray-700 dark:text-gray-200">
                                            Product
                                        </TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">
                                            Quantity
                                        </TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">
                                            Price/Unit
                                        </TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">
                                            Total
                                        </TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">
                                            Gift?
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedOrder.items.map((item) => (
                                        <TableRow key={item.order_item_id}>
                                            <TableCell className="text-gray-900 dark:text-gray-50">
                                                {   item.product_name   }
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-gray-300">
                                                { formatNumberWithCommas(item.stock_change,0)}{" "}{item.unit_of_measure}
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-gray-300">
                                                {formatCurrency(item.price_per_gram)}
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-gray-300">
                                                {
                                                    formatCurrency(
                                                    parseFloat(item.stock_change) * parseFloat(item.price_per_gram))
                                                }
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-gray-300">
                                                {   item.is_gift === 1
                                                    ? "Yes"
                                                    : "No"  }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        { error && ( <p className="text-red-500 text-sm w-full text-center">{error}</p> )}
                    </DialogContent>
                </Dialog>
            )}

            {/* NEW: Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
                <DialogPortal>
                    <DialogOverlay />
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                WARNING: Permanently deleting this order **cannot be undone** and **will NOT revert stock changes**. You must manually record any compensating adjustments if needed.
                                <br /><br />
                                Are you sure you want to proceed with deleting Order ID: **{orderToDeleteId}**?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <button type="button" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out">Cancel
                                </button>
                            </DialogClose>
                            <button onClick={handleConfirmDelete} 
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out">
                                Confirm Delete
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPortal>
            </Dialog>

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Order ID
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Date
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Customer
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Total Amount
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Status
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Delivery
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan="7" className="text-center text-gray-500 dark:text-gray-400">
                                No orders found for the selected filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.order_id}
                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700" >
                                <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                    {order.order_id}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    { new Date( order.order_date).toLocaleDateString("vi-VN") }
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {order.customer_name || "Guest"}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    { formatCurrency(order.total_amount) }
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    { order.status }
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {order.delivery_method}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleViewOrderClick(order)}
                                            className="text-green-500 border-green-500 hover:bg-green-50 dark:hover:bg-green-900" >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDeleteOrder(order.order_id) }
                                            className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900" >
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

export default OrdersPage;
