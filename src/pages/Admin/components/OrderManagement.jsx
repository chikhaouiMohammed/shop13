import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // Import updateDoc and doc
import { db } from '../../../Data/firebase';
import { BeatLoader } from 'react-spinners';
import Footer from '../../../components/Footer/Footer';
import { FaSearch, FaFilter, FaTruck, FaShoppingCart, FaUser, FaPhone, FaMapMarkerAlt, FaRulerCombined, FaPalette, FaCube, FaMoneyBillWave, FaCalendarAlt, FaEye } from 'react-icons/fa'; // Importing react-icons
import toast from 'react-hot-toast'; // Good for notifications on updates

const OrderManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState({}); // State to track loading for individual order updates

  // Define possible order statuses
  const orderStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const ordersCollection = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCollection);
        const ordersList = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
        setAllOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders: ", error);
        toast.error('فشل تحميل الطلبات.'); // Show error to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterOrders(query, selectedStatus);
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setSelectedStatus(status);
    filterOrders(searchQuery, status);
  };

  const filterOrders = (query, status) => {
    let filteredOrders = allOrders;

    if (query) {
      filteredOrders = filteredOrders.filter(order => {
        const fullName = order.deliveryInfo?.fullName?.toLowerCase() || '';
        const phone = order.deliveryInfo?.phone?.toLowerCase() || '';
        const wilaya = order.deliveryInfo?.wilaya?.toLowerCase() || '';
        const baladia = order.deliveryInfo?.baladia?.toLowerCase() || '';
        const productName = order.productName?.toLowerCase() || '';

        return (
          fullName.includes(query) ||
          phone.includes(query) ||
          wilaya.includes(query) ||
          baladia.includes(query) ||
          productName.includes(query) ||
          order.id.toLowerCase().includes(query)
        );
      });
    }

    if (status && status !== 'All') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    setOrders(filteredOrders);
  };

  // New function to handle order status update
  const handleOrderStatusChange = async (orderId, newStatus) => {
    setIsUpdating(prev => ({ ...prev, [orderId]: true })); // Set loading for this specific order
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Update the local state (orders and allOrders)
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);

      const updatedAllOrders = allOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setAllOrders(updatedAllOrders);

      toast.success(`تم تحديث حالة الطلب ${orderId.substring(0, 8)}... إلى ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error("Error updating order status: ", error);
      toast.error('فشل تحديث حالة الطلب.');
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false })); // End loading for this specific order
    }
  };


  const formatDateTime = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString('ar-DZ', { // Use Arabic locale for Algeria
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
      });
    }
    return 'غير متوفر';
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Confirmed': return 'text-blue-600 bg-blue-50';
      case 'Shipped': return 'text-purple-600 bg-purple-50';
      case 'Delivered': return 'text-green-600 bg-green-50';
      case 'Cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending': return 'معلق';
      case 'Confirmed': return 'تم التأكيد';
      case 'Shipped': return 'تم الشحن';
      case 'Delivered': return 'تم التوصيل';
      case 'Cancelled': return 'ملغى';
      default: return status; // Fallback if status isn't translated
    }
  };

  return (
    <div className="font-poppins bg-gray-100 min-h-screen flex flex-col">
      {/* <NavBar /> */} {/* Uncomment if you want NavBar here */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-10 flex-grow">
        <h1 className='text-3xl md:text-5xl font-extrabold text-gray-900 text-center mb-10'>
          لوحة تحكم الطلبات <span className="text-blue-600">الإدارية</span>
        </h1>

        {/* Search and Filter Section - Responsive Layout */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 md:gap-6 items-center rtl" dir="rtl">
          {/* Search Bar */}
          <div className="relative flex-grow w-full md:w-auto">
            <label htmlFor="search" className="sr-only">بحث بالاسم، الهاتف، الولاية، البلدية أو اسم المنتج:</label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
              placeholder="البحث عن طريق رقم الطلب، العميل، الهاتف، الولاية، المنتج..."
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          {/* Status Dropdown (for filtering) */}
          <div className="relative w-full md:w-auto md:min-w-[200px]">
            <label htmlFor="statusFilter" className="sr-only">تصفية حسب الحالة:</label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white appearance-none transition-all duration-200 text-sm sm:text-base"
            >
              <option value="All">جميع الحالات</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>{getStatusText(status)}</option>
              ))}
            </select>
            <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16 sm:py-20 bg-white rounded-2xl shadow-lg">
            <BeatLoader size={25} sm:size={30} color="#3B82F6" />
            <p className="mr-3 sm:mr-4 text-gray-600 text-base sm:text-lg">جارٍ تحميل الطلبات...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-700 text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">لا توجد طلبات مطابقة.</p>
            <p className="text-gray-500 text-sm sm:text-base">حاول تغيير معايير البحث أو التصفية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => {
              const fullName = order.deliveryInfo?.fullName || 'غير متوفر';
              const phone = order.deliveryInfo?.phone || 'غير متوفر';
              const wilaya = order.deliveryInfo?.wilaya || 'غير متوفر';
              const baladia = order.deliveryInfo?.baladia || 'غير متوفر';
              const productName = order.productName || 'غير متوفر';
              const productPrice = order.productPrice ? order.productPrice.toLocaleString('ar-DZ') : 'غير متوفر';
              const quantity = order.quantity || 1;
              const selectedColor = order.selectedColor || 'N/A';
              const selectedSize = order.selectedSize || 'N/A';
              const shippingPrice = order.shippingPrice ? order.shippingPrice.toLocaleString('ar-DZ') : '0';
              const totalAmount = order.totalAmount ? order.totalAmount.toLocaleString('ar-DZ') : 'غير متوفر';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col md:flex-row rtl"
                  dir="rtl"
                >
                  {/* Product Image Section */}
                  <div className="w-full md:w-1/4 p-4 sm:p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-b md:border-b-0 md:border-l border-gray-200">
                    {order.productImage ? (
                      <img
                        src={order.productImage}
                        alt={productName}
                        className="w-full max-h-40 sm:max-h-52 object-contain rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-40 bg-gray-200 flex flex-col items-center justify-center rounded-lg text-gray-500 text-center text-sm sm:text-base">
                        <FaCube className="text-2xl sm:text-3xl mb-2" />
                        <span>لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Order Details Section */}
                  <div className="w-full md:w-3/4 p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 mb-3 border-gray-200">
                      <h3 className='text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-0'>
                        طلب #<span className='font-normal text-blue-700'>{order.id.substring(0, 8)}...</span> {/* Truncate ID */}
                      </h3>
                      {/* Status Dropdown (for changing status) */}
                      <div className="relative flex items-center gap-2">
                          {isUpdating[order.id] && (
                            <BeatLoader size={6} sm:size={8} color="#3B82F6" className="ml-2" />
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            className={`p-2 rounded-md font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${getStatusColorClass(order.status)}`}
                            disabled={isUpdating[order.id]} // Disable while updating
                          >
                            {orderStatuses.map(status => (
                              <option key={status} value={status} className="bg-white text-gray-900">
                                {getStatusText(status)}
                              </option>
                            ))}
                          </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-gray-700 text-xs sm:text-sm md:text-base">
                      <p className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-green-500 text-base sm:text-lg" />
                        <strong>الإجمالي:</strong> <span className="font-bold text-base sm:text-lg text-gray-900">{totalAmount} دج</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCalendarAlt className="text-indigo-500 text-base sm:text-lg" />
                        <strong>التاريخ:</strong> {formatDateTime(order.orderDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaUser className="text-blue-500 text-base sm:text-lg" />
                        <strong>العميل:</strong> {fullName}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaPhone className="text-purple-500 text-base sm:text-lg" />
                        <strong>الهاتف:</strong> {phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500 text-base sm:text-lg" />
                        <strong>الولاية:</strong> {wilaya}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-orange-500 text-base sm:text-lg" />
                        <strong>البلدية:</strong> {baladia}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaShoppingCart className="text-teal-500 text-base sm:text-lg" />
                        <strong>المنتج:</strong> {productName}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCube className="text-cyan-500 text-base sm:text-lg" />
                        <strong>الكمية:</strong> {quantity}
                      </p>
                      {order.selectedColor && (
                        <p className="flex items-center gap-2">
                          <FaPalette className="text-pink-500 text-base sm:text-lg" />
                          <strong>اللون:</strong> {selectedColor}
                        </p>
                      )}
                      {order.selectedSize && (
                        <p className="flex items-center gap-2">
                          <FaRulerCombined className="text-lime-500 text-base sm:text-lg" />
                          <strong>المقاس:</strong> {selectedSize}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-gray-500 text-base sm:text-lg" />
                        <strong>سعر المنتج:</strong> {productPrice} دج
                      </p>
                      <p className="flex items-center gap-2">
                        <FaTruck className="text-amber-500 text-base sm:text-lg" />
                        <strong>سعر التوصيل:</strong> {shippingPrice} دج
                      </p>
                    </div>                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* <Footer /> */} {/* Uncomment if you want Footer here */}
    </div>
  );
}

export default OrderManagement;