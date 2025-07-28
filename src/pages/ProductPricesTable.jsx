import React, { useState, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { apiCall, formatCurrency } from "@/utils/formatters";

function ProductPricesTable({ authToken }) {
  const [productPrices, setProductPrices] = useState([]);
  const [editingProductPricesId, setEditingProductPricesId] = useState(null);
  const [editedProductPrices, setEditedProductPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      fetchData();
  }, []); 

  const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
          const productPricesData = await apiCall(`/product-prices`, 'GET', null, authToken);
          setProductPrices(productPricesData);
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleEditClick = (productPrice) => {
    setEditingProductPricesId(productPrice.product_price_id);
    setEditedProductPrices({ ...productPrice }); // Copy product data to edit state
  };

  const handleSaveClick = async (id) => {
   
    setLoading(true);
    setError(null);
    try {
      
      await apiCall(`/product-prices/${id}`, 'PUT', editedProductPrices, authToken)

      // If successful, update local state and exit editing mode
      setProductPrices(productPrices.map(productPrice =>
        productPrice.product_price_id === id ? { ...editedProductPrices } : productPrice
      ));
      setEditingProductPricesId(null);
      setEditedProductPrices({});
      
    } catch (err) {
      console.error("Error saving Product Prices table:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setEditingProductPricesId(null);
    setEditedProductPrices({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProductPrices(prev => ({
      ...prev,
      [name]: ['retail_price', 'wholesale_price', 'member_price'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">Error: {error}</p>
        <p>Check connection to backend server and login.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
     {/*<div className="p-4 max-w-5xl mx-auto overflow-y-auto max-h-[300px]">*/}
      <h1 className="text-2xl font-bold mb-4 text-center">Bird's nest soup Price</h1>      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Retail price</TableHead>
            <TableHead>Bulk price</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productPrices.map((productPrice) => (
            <TableRow key={productPrice.product_price_id}>
              <TableCell className="font-medium">{productPrice.product_price_id}</TableCell>
              <TableCell>
                { editingProductPricesId === productPrice.product_price_id ? (
                  <Input
                    type="text"
                    name="type"
                    value={editedProductPrices.type || ''}
                    onChange={handleChange}
                    className="w-full"
                  />
                ) : ( productPrice.type )}
              </TableCell>
              <TableCell>
                {editingProductPricesId === productPrice.product_price_id ? (
                  <Input
                    type="number"
                    name="retail_price"
                    value={editedProductPrices.retail_price || ''}
                    onChange={handleChange}
                    className="w-full"
                  />
                ) : (
                  formatCurrency(productPrice.retail_price)
                )}
              </TableCell>
              <TableCell>
                {editingProductPricesId === productPrice.product_price_id ? (
                  <Input
                    type="number"
                    name="wholesale_price"
                    value={editedProductPrices.wholesale_price || ''}
                    onChange={handleChange}
                    className="w-full"
                  />
                ) : (
                  formatCurrency(productPrice.wholesale_price)
                )}
              </TableCell>
              <TableCell>
                {editingProductPricesId === productPrice.product_price_id ? (
                  <Input
                    type="number"
                    name="member_price"
                    value={editedProductPrices.member_price || ''}
                    onChange={handleChange}
                    className="w-full"
                  />
                ) : (
                  formatCurrency(productPrice.member_price)
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingProductPricesId === productPrice.product_price_id ? (
                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => handleSaveClick(productPrice.product_price_id)} size="sm">Save</Button>
                    <Button variant="outline" onClick={handleCancelClick} size="sm">Cancel</Button>
                  </div>
                ) : (
                  <Button onClick={() => handleEditClick(productPrice)} size="sm">Edit</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProductPricesTable;
