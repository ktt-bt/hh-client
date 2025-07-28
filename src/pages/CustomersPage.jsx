import { useState, useEffect, useRef, memo, useCallback } from "react";
import { apiCall } from "@/utils/formatters"; 

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Edit, Trash2, 
} from 'lucide-react'; 

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
    DialogTrigger
} from "@/components/ui/dialog";


const SearchInputWithDebounce = memo(({
    initialValue = '', // This will only set the initial state on mount
    placeholder = '',
    debounceTime = 500,
    onDebouncedChange, // This is the ONLY way the parent should update its search state
    className = ''
}) => {
    // 1. localSearchTerm: This state holds the IMMEDIATE value of the input field.
    // It changes with every keystroke.
    const [localSearchTerm, setLocalSearchTerm] = useState(initialValue);

    // 2. debouncedSearchTerm: This state holds the value that updates after the debounceTime.
    // This is the stable value that gets sent to the parent.
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

    // Effect 1: Debounce logic
    // This effect watches 'localSearchTerm'. When it changes, it sets a timer.
    // If 'localSearchTerm' changes again before the timer fires, the previous timer is cleared.
    // Only when typing stops for 'debounceTime' does 'debouncedSearchTerm' get updated.
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(localSearchTerm);
        }, debounceTime);

        // Cleanup function: This runs if the component unmounts OR if localSearchTerm/debounceTime changes
        // before the previous timeout has fired. This is crucial for correctly debouncing.
        return () => {
            clearTimeout(handler);
        };
    }, [localSearchTerm, debounceTime]); // Dependencies: Trigger this effect when localSearchTerm or debounceTime changes

    // Effect 2: Notify parent
    // This effect watches 'debouncedSearchTerm'. When it changes (meaning typing has stopped and debounced),
    // it calls the 'onDebouncedChange' callback provided by the parent.
    useEffect(() => {
        onDebouncedChange(debouncedSearchTerm);
    }, [debouncedSearchTerm, onDebouncedChange]); // Dependencies: Trigger this effect when debouncedSearchTerm or onDebouncedChange changes

    // Handler for the clear button
    const handleClearSearch = () => {
        setLocalSearchTerm('');      // Clear the immediate input field visually
        setDebouncedSearchTerm('');  // Reset the debounced state as well
        onDebouncedChange('');       // Immediately notify the parent that the search term is empty
    };

    return (
        <div className={`flex gap-2 items-center ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={localSearchTerm} // Input's value is controlled by localSearchTerm
                onChange={(e) => setLocalSearchTerm(e.target.value)} // Update localSearchTerm on every keystroke
                className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            {/* Show clear button only if there's text in the input */}
            {localSearchTerm && (
                <button
                    onClick={handleClearSearch}
                    className="p-2 text-gray-500 hover:text-gray-700"
                >
                    &times; {/* Simple X for clear button */}
                </button>
            )}
        </div>
    );
});

// --- Customers Page Component ---
const CustomersPage = ({ authToken }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // General error for the page (e.g., fetch error)
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone_number: '',
        address: ''
    });
    // Specific errors for add dialog, initially empty
    const [addFormErrors, setAddFormErrors] = useState({ name: '', phone_number: '', address: '' });
    const [editingCustomer, setEditingCustomer] = useState(null);
    // Specific errors for edit dialog, initially empty
    const [editFormErrors, setEditFormErrors] = useState({ name: '', phone_number: '', address: '' });
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // This state will hold the debounced value received from the SearchInputWithDebounce component
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');
    const [displayMessage, setDisplayMessage] = useState('Type something to search...');

    // This callback function receives the debounced value from the child component.
    // It's wrapped in useCallback to ensure its reference is stable, which is important
    // because it's passed as a prop to a memoized child component (SearchInputWithDebounce).
    const handleDebouncedSearchChange = useCallback((debouncedValue) => {
        // console.log(`Debounced value received by parent: "${debouncedValue}"`);
        setCurrentSearchTerm(debouncedValue);
    }, []); // Empty dependency array means this function is created only once.

   
    // Refs for input fields to set focus
    const newNameInputRef = useRef(null);
    const newPhoneInputRef = useRef(null);
    const newAddressInputRef = useRef(null);

    const editNameInputRef = useRef(null);
    const editPhoneInputRef = useRef(null);
    const editAddressInputRef = useRef(null);

    // Effect to fetch data, now depends on currentSearchTerm
    useEffect(() => {
        setDisplayMessage(`Searching for: "${currentSearchTerm}"... `);
        // In a real app, you'd trigger your API call here, e.g.:
        fetchData();

    }, [authToken, currentSearchTerm]); // Re-fetch only when debounced currentSearchTerm changes

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (currentSearchTerm) {
                params.append('name', currentSearchTerm);
            } else {
                setDisplayMessage('Name of customer is cleared/empty. Type new name to search...');
            }
            const customersData = await apiCall(`/customers?${params.toString()}`, 'GET', null, authToken);
            setCustomers(customersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (editingCustomer) {
            setEditingCustomer(prev => ({ ...prev, [id]: value }));
            // Clear specific error for the field being typed into
            setEditFormErrors(prev => ({ ...prev, [id]: '' }));
        } else {
            setNewCustomer(prev => ({ ...prev, [id]: value }));
            // Clear specific error for the field being typed into
            setAddFormErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setAddFormErrors({ name: '', phone_number: '', address: '' }); // Clear all previous form errors
        setError(''); // Clear general page error

        try {
            await apiCall('/customers', 'POST', newCustomer, authToken);
            setNewCustomer({ name: '', phone_number: '', address: '' }); // Reset form
            setIsAddDialogOpen(false); // Close dialog on success
            fetchData(); // Re-fetch data
        } catch (err) {
            const errorMessage = err.message;
            // Check for specific error messages from the backend
            if (errorMessage.includes('Phone number must be exactly 10 digits')) {
                setAddFormErrors(prev => ({ ...prev, phone_number: errorMessage }));
                setNewCustomer(prev => ({ ...prev, phone_number: '' })); // Clear wrong input
                newPhoneInputRef.current?.focus(); // Focus on the cleared input
            } else if (errorMessage.includes('Customer name is required')) {
                setAddFormErrors(prev => ({ ...prev, name: errorMessage }));
                newNameInputRef.current?.focus();
            } else {
                setError(errorMessage); // Fallback for other general errors
            }
        }
    };

    const handleEditClick = (customer) => {
        // Set editing customer and clear any previous edit form errors when opening
        setEditingCustomer({ ...customer });
        setEditFormErrors({ name: '', phone_number: '', address: '' });
        setIsEditDialogOpen(true);
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        setEditFormErrors({ name: '', phone_number: '', address: '' }); // Clear all previous form errors
        setError(''); // Clear general page error

        try {
            await apiCall(`/customers/${editingCustomer.customer_id}`, 'PUT', editingCustomer, authToken);
            setEditingCustomer(null); // Clear editing state
            setIsEditDialogOpen(false); // Close dialog on success
            fetchData(); // Re-fetch data
        } catch (err) {
            const errorMessage = err.message;
            // Check for specific error messages from the backend
            if (errorMessage.includes('Phone number must be exactly 10 digits')) {
                setEditFormErrors(prev => ({ ...prev, phone_number: errorMessage }));
                setEditingCustomer(prev => ({ ...prev, phone_number: '' })); // Clear wrong input
                editPhoneInputRef.current?.focus(); // Focus on the cleared input
            } else if (errorMessage.includes('Customer name is required')) {
                setEditFormErrors(prev => ({ ...prev, name: errorMessage }));
                editNameInputRef.current?.focus();
            } else {
                setError(errorMessage); // Fallback for other general errors
            }
        }
    };

    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to permanently delete this customer? This action cannot be undone.')) {
            setError('');
            try {
                await apiCall(`/customers/${customerId}`, 'DELETE', null, authToken);
                fetchData();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div className="text-center p-4 text-gray-700 dark:text-gray-300">Loading customers...</div>;
    // General page error, distinct from dialog-specific errors
    if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner relative">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Customers</h2>

            {/* Search Input with Clear Button (using the new component) */}
            <SearchInputWithDebounce
                placeholder="Search by customer name..."
                debounceTime={500} // Debounce for 500 milliseconds
                onDebouncedChange={handleDebouncedSearchChange}
                initialValue={currentSearchTerm} // Keeps the input synchronized if currentSearchTerm changes externally
                className="mb-4"
            />

            <p style={{ marginTop: '10px', color: '#888' }}>
                {displayMessage}
            </p>

            {/* Add Customer Dialog Trigger (FAB) */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) { // Reset form and errors when dialog closes
                    setNewCustomer({ name: '', phone_number: '', address: '' });
                    setAddFormErrors({ name: '', phone_number: '', address: '' });
                }
            }}>
                <DialogTrigger asChild>
                    <Button
                        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform duration-200 hover:scale-105"
                        size="icon"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Add Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer} className="flex flex-wrap gap-4 py-4">
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name</Label>
                            <Input id="name" value={newCustomer.name} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${addFormErrors.name ? 'border-red-500' : ''}`}  ref={newNameInputRef} />
                            {addFormErrors.name && <p className="text-red-500 text-sm mt-1">{addFormErrors.name}</p>}
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <Label htmlFor="phone_number" className="text-gray-700 dark:text-gray-300">Phone</Label>
                            <Input id="phone_number" type="tel" pattern="[0-9]*" value={newCustomer.phone_number} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${addFormErrors.phone_number ? 'border-red-500' : ''}`} ref={newPhoneInputRef} />
                            {addFormErrors.phone_number && <p className="text-red-500 text-sm mt-1">{addFormErrors.phone_number}</p>}
                        </div>
                        <div className="w-full">
                            <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Address</Label>
                            <Textarea id="address" value={newCustomer.address} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${addFormErrors.address ? 'border-red-500' : ''}`} ref={newAddressInputRef} />
                            {addFormErrors.address && <p className="text-red-500 text-sm mt-1">{addFormErrors.address}</p>}
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">Add Customer</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            {editingCustomer && (
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) { // Reset editing state and errors when dialog closes
                        setEditingCustomer(null);
                        setEditFormErrors({ name: '', phone_number: '', address: '' });
                    }
                }}>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Edit Customer</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateCustomer} className="flex flex-wrap gap-4 py-4">
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name</Label>
                                <Input id="name" value={editingCustomer.name} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${editFormErrors.name ? 'border-red-500' : ''}`} ref={editNameInputRef} />
                                {editFormErrors.name && <p className="text-red-500 text-sm mt-1">{editFormErrors.name}</p>}
                            </div>
                            <div className="flex-1 min-w-[280px]">
                                <Label htmlFor="phone_number" className="text-gray-700 dark:text-gray-300">Phone</Label>
                                <Input id="phone_number" type="tel" pattern="[0-9]*" value={editingCustomer.phone_number} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${editFormErrors.phone_number ? 'border-red-500' : ''}`} ref={editPhoneInputRef} />
                                {editFormErrors.phone_number && <p className="text-red-500 text-sm mt-1">{editFormErrors.phone_number}</p>}
                            </div>
                            <div className="w-full">
                                <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Address</Label>
                                <Textarea id="address" value={editingCustomer.address} onChange={handleInputChange} className={`w-full dark:bg-gray-700 dark:text-gray-50 ${editFormErrors.address ? 'border-red-500' : ''}`} ref={editAddressInputRef} />
                                {editFormErrors.address && <p className="text-red-500 text-sm mt-1">{editFormErrors.address}</p>}
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md mt-4">Update Customer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <Table className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <TableHeader className="bg-gray-100 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-200">Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Phone Number</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Address</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan="4" className="text-center text-gray-500 dark:text-gray-400">
                                No customers found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customers.map((customer) => (
                            <TableRow key={customer.customer_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <TableCell className="font-medium text-gray-900 dark:text-gray-50">{customer.name}</TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">{customer.phone_number}</TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">{customer.address}</TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(customer)} className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDeleteCustomer(customer.customer_id)} className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900">
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

export default CustomersPage;