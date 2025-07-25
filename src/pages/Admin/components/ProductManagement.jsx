import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../Data/firebase'; // Adjust path as needed
import { FaSearch, FaPlus, FaTrash, FaEdit, FaBoxOpen, FaThList, FaMoneyBillWave, FaWarehouse } from 'react-icons/fa'; // Importing react-icons for better UX
import { BeatLoader } from 'react-spinners'; // For loading state
// import NavBar from '../../../components/Header/NavBar'; // Assuming path for Admin NavBar (commented out as per previous interaction)
// import Footer from '../../../components/Footer/Footer'; // Assuming path for Admin Footer (commented out as per previous interaction)


const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      setIsLoading(true);
      try {
        const [productsSnapshot, categoriesSnapshot] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories'))
        ]);

        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ensure totalStock is properly set for all products, especially if variationType exists
        const enhancedProductsData = productsData.map(product => {
          if (product.variationType === 'color-size' && product.productColors) {
            const totalStock = product.productColors.reduce((acc, color) => {
              if (color.sizes) {
                return acc + Object.values(color.sizes).reduce((sum, stock) => sum + stock, 0);
              }
              return acc;
            }, 0);
            return { ...product, totalStock: totalStock };
          } else if (product.variationType === 'color-only' && product.productColors) {
            const totalStock = product.productColors.reduce((acc, color) => acc + (color.quantity || 0), 0);
            return { ...product, totalStock: totalStock };
          }
          // If product is simple or no variationType, assume totalStock is explicitly set or default to 0
          return { ...product, totalStock: product.totalStock || 0 };
        });


        const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name);

        setProducts(enhancedProductsData);
        setFilteredProducts(enhancedProductsData);
        setCategories(categoriesData);
      } catch (e) {
        console.error('Error fetching data:', e);
        // In a real app, you'd show a user-friendly error message
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    const filterProducts = () => {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = products.filter(product => {
        const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
        const productName = product.productName ? product.productName.toLowerCase() : '';
        const matchesSearchQuery = productName.includes(lowercasedQuery);
        return matchesCategory && matchesSearchQuery;
      });
      setFilteredProducts(filtered);
    };

    filterProducts();
  }, [searchQuery, selectedCategory, products]);


  const handleDelete = async (productId) => {
    const isConfirmed = window.confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟');
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(product => product.id !== productId));
        setFilteredProducts(filteredProducts.filter(product => product.id !== productId));
        alert('تم حذف المنتج بنجاح.');
      } catch (e) {
        console.error('خطأ في حذف المنتج:', e);
        alert('فشل حذف المنتج.');
      }
    }
  };

  return (
    <div className="font-poppins bg-gray-100 min-h-screen flex flex-col">
      {/* <NavBar /> */} {/* Uncomment if you want NavBar here */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-10 flex-grow rtl" dir="rtl">
        <h1 className='text-3xl md:text-5xl font-extrabold text-gray-900 text-center mb-10'>
          لوحة تحكم <span className="text-blue-600">المنتجات</span>
        </h1>

        {/* Action Bar: Categories, Search Bar, and Add New Product Button */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row gap-6 items-center">
          {/* Categories Dropdown */}
          <div className="relative w-full md:w-1/4">
            <label htmlFor="categoryFilter" className="sr-only">تصفية حسب الفئة:</label>
            <select
              id="categoryFilter"
              className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white appearance-none transition-all duration-200 text-sm md:text-base"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">جميع الفئات</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            <FaThList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative flex-grow w-full md:w-1/2">
            <label htmlFor="productSearch" className="sr-only">البحث عن المنتجات:</label>
            <input
              type="text"
              id="productSearch"
              className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-sm md:text-base"
              placeholder="البحث باسم المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Add New Product Button */}
          <div className="w-full md:w-1/4 flex justify-center md:justify-start"> {/* Adjusted for RTL: button aligned left on desktop */}
            <Link
              to='/products/add-new-product'
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center text-sm md:text-base"
            >
              <FaPlus />
              إضافة منتج جديد
            </Link>
          </div>
        </div>

        {/* Products List - Loading/Empty State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-lg">
            <BeatLoader size={30} color="#3B82F6" />
            <p className="mr-4 text-gray-600 text-lg">جارٍ تحميل المنتجات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-700 text-2xl font-semibold mb-4">لا توجد منتجات مطابقة.</p>
            <p className="text-gray-500">حاول تغيير معايير البحث أو التصفية.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto w-full rounded-2xl shadow-lg border border-gray-200">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-right"> {/* Text right for RTL */}
                    <th className="p-4 text-sm font-semibold whitespace-nowrap">صورة المنتج</th>
                    <th className="p-4 text-sm font-semibold whitespace-nowrap">اسم المنتج</th>
                    <th className="p-4 text-sm font-semibold whitespace-nowrap">الفئة</th>
                    <th className="p-4 text-sm font-semibold whitespace-nowrap">السعر</th>
                    <th className="p-4 text-sm font-semibold whitespace-nowrap">المخزون الكلي</th>
                    <th className="p-4 text-center text-sm font-semibold whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-4">
                        <img
                          src={(product.images && product.images[0]) || '/images/product/placeholder.webp'}
                          alt={product.productName || 'Product Image'}
                          className="w-16 h-16 object-cover rounded-md shadow-sm border border-gray-200"
                        />
                      </td>
                      <td className="p-4 text-gray-800 font-medium text-sm md:text-base">{product.productName || 'غير متوفر'}</td>
                      <td className="p-4 text-gray-700 text-sm md:text-base">{product.category || 'غير مصنف'}</td>
                      <td className="p-4 text-gray-800 font-bold whitespace-nowrap text-sm md:text-base">{product.finalPrice?.toLocaleString('ar-DZ') || product.price?.toLocaleString('ar-DZ') || '0'} دج</td>
                      <td className="p-4 text-gray-800 font-semibold text-sm md:text-base">{product.totalStock ?? 0}</td> {/* Use nullish coalescing for stock */}
                      <td className="p-4 flex gap-3 justify-center items-center h-full"> {/* Actions always centered in table */}
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 px-3 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:bg-red-600 transform hover:scale-105 flex items-center gap-1.5 text-xs sm:text-sm"
                        >
                          <FaTrash />
                          حذف
                        </button>
                        <Link
                          to={`/products/edit-product/${product.id}`}
                          className="bg-blue-600 px-3 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:bg-blue-700 transform hover:scale-105 flex items-center gap-1.5 text-xs sm:text-sm"
                        >
                          <FaEdit />
                          تعديل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-6 md:hidden">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={(product.images && product.images[0]) || '/images/product/placeholder.webp'}
                      alt={product.productName || 'Product Image'}
                      className="w-20 h-20 object-cover rounded-md shadow-sm border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{product.productName || 'غير متوفر'}</h3>
                      <p className="text-gray-700 text-sm">
                        <span className="font-semibold">الفئة:</span> {product.category || 'غير مصنف'}
                      </p>
                      <p className="text-gray-800 font-bold text-base mt-1">
                        <span className="font-semibold">السعر:</span> {product.finalPrice?.toLocaleString('ar-DZ') || product.price?.toLocaleString('ar-DZ') || '0'} دج
                      </p>
                      <p className="text-gray-800 font-semibold text-sm mt-1">
                        <span className="font-semibold">المخزون:</span> {product.totalStock ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 border-t pt-3 border-gray-100">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 px-3 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:bg-red-600 flex items-center gap-1.5 text-sm w-full justify-center"
                    >
                      <FaTrash />
                      حذف
                    </button>
                    <Link
                      to={`/products/edit-product/${product.id}`}
                      className="bg-blue-600 px-3 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:bg-blue-700 flex items-center gap-1.5 text-sm w-full justify-center"
                    >
                      <FaEdit />
                      تعديل
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* <Footer /> */} {/* Uncomment if you want Footer here */}
    </div>
  );
};

export default ProductManagement;