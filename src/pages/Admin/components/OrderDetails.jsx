import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../Data/firebase';
import toast from 'react-hot-toast'; // Updated import for react-hot-toast

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const orderDoc = doc(db, 'orders', id);
        const orderSnapshot = await getDoc(orderDoc);
        if (orderSnapshot.exists()) {
          setOrderDetails(orderSnapshot.data());
        } else {
          toast.error("Order not found");
        }
      } catch (error) {
        toast.error("Error fetching order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = (newStatus) => {
    setOrderDetails((prevDetails) => ({
      ...prevDetails,
      status: newStatus
    }));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const orderDoc = doc(db, 'orders', id);
      await updateDoc(orderDoc, {
        status: orderDetails.status,
      });
      toast.success("Order status updated successfully");
    } catch (error) {
      toast.error("Error updating order status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsLoading(true);
    try {
      await addTheProductStock();
      const orderDoc = doc(db, 'orders', id);
      await deleteDoc(orderDoc);
      toast.success("Order deleted successfully");
      navigate('/admin/orders'); // Redirect to orders list after deletion
    } catch (error) {
      toast.error("Error deleting order");
    } finally {
      setIsLoading(false);
    }
  };

  const addTheProductStock = async () => {
    try {
      for (const item of orderDetails.cartItems) {
        const { id: productId, selectedColor, selectedSize, quantity } = item;
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
  
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const colorObj = productData.productColors.find(color => color.colorName === selectedColor);
          
          if (colorObj && colorObj.sizes[selectedSize] != null) {
            colorObj.sizes[selectedSize] += quantity;
            const totalStock = productData.productColors.reduce((total, color) => {
              return total + Object.values(color.sizes).reduce((sum, sizeStock) => sum + sizeStock, 0);
            }, 0);
  
            await updateDoc(productRef, {
              productColors: productData.productColors,
              totalStock: totalStock,
            });
          }
        }
      }
  
      toast.success("Stock updated successfully");
    } catch (error) {
      toast.error("Error updating stock");
    }
  };

  const formatDateTime = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString(); // Formats date and time
    }
    return 'N/A';
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!orderDetails) {
    return <div className="text-center">Order not found</div>;
  }

  return (
    <div className="container mx-auto md:px-20 px-10 py-6 text-darkGray">
      <p className='font-bold w-full text-center text-xl md:text-3xl py-5'>Order Details</p>

      <div className="w-full bg-gray-200 p-5 rounded-2xl">
        <div className="mb-4">
          <h3 className='text-2xl font-semibold'>Order ID: <span className='font-medium'>{id}</span></h3>
          <h4 className='text-xl font-semibold'>Date: <span className='font-medium'>{formatDateTime(orderDetails.orderDate)}</span></h4>
          <h4 className='text-xl font-semibold'>Total: <span className='font-medium'>{orderDetails.totalAmount}</span></h4>
          <h4 className='text-xl font-semibold'>Status: 
            <span className='font-medium'>
              <select
                value={orderDetails.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="ml-2 p-1 border border-gray-300 rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Shipped">Shipped</option>
              </select>
            </span>
          </h4>
          <h4 className='text-xl font-semibold'>Shipping Address: <span className='font-medium'>{orderDetails.shippingAddress}</span></h4>
        </div>

        <div>
          <h3 className='text-xl font-semibold mb-3'>Items:</h3>
          {orderDetails.cartItems.map((item, index) => (
            <div key={index} className="mb-2">
              <h4 className='text-lg font-semibold'>{item.name}</h4>
              <p className='text-md'>Quantity: {item.quantity}</p>
              <p className='text-md'>Price: {item.price}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleDeleteOrder}
            className="bg-red-600 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Order'}
          </button>
          <button
            onClick={handleSaveChanges}
            className="bg-blue-950 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
  
};

export default OrderDetails;
