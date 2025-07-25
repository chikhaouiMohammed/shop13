import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, storage } from '../../../Data/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';
import Footer from '../../../components/Footer/Footer'; // Assuming Footer is part of your admin layout
// Corrected and comprehensive import for react-icons/fa and react-icons/md
import { FaBoxes, FaPalette, FaPlus, FaTrash, FaEdit, FaTimes, FaUpload, FaChevronDown, FaRulerCombined, FaMoneyBillWave } from 'react-icons/fa';
import { MdColorLens } from 'react-icons/md';

const EditProduct = () => {
  const { id } = useParams();
  const [existingProduct, setExistingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state - using initial values from existingProduct after fetch
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]); // All available categories
  const [productColors, setProductColors] = useState([]); // For color/size variations
  const [newColor, setNewColor] = useState({ colorCode: '#000000', colorName: '', sizes: {} }); // For adding new color
  const [selectedSize, setSelectedSize] = useState(''); // For adding stock to new color sizes
  const [stock, setStock] = useState(''); // For stock amount for a specific size
  const [availableSizes, setAvailableSizes] = useState([]); // All global available sizes
  const [newSize, setNewSize] = useState(''); // For adding a new global size
  const [images, setImages] = useState([]); // Product images
  const [price, setPrice] = useState(''); // Base price
  const [discount, setDiscount] = useState(''); // Discount percentage or amount

  // Fetch product data, categories, and sizes on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      let productData = null; // Declare productData at a higher scope

      try {
        const productDocSnap = await getDoc(doc(db, 'products', id));
        if (productDocSnap.exists()) {
          productData = productDocSnap.data(); // Assign data here
          setExistingProduct(productData);
          // Initialize form fields with existing productData
          setProductName(productData.productName || '');
          setDescription(productData.description || '');
          // Do NOT set category here yet, wait for fetchedCategories
          setProductColors(productData.productColors || []);
          setPrice(productData.price || '');
          setDiscount(productData.discount || '');
          setImages(productData.images || []); // Existing image URLs
          if (productData.variationType === 'simple') {
            setStock(productData.totalStock || ''); // Simple product stock
          }
        } else {
          toast.error('لم يتم العثور على المنتج.'); // Product not found
          setIsLoading(false); // Stop loading if product not found
          return; // Exit early if no product is found
        }

        const categoriesSnap = await getDocs(collection(db, 'categories'));
        const fetchedCategories = categoriesSnap.docs.map(d => d.data().name);
        setCategories(fetchedCategories);

        // Now set the category, ensuring productData is available
        if (productData) { // Check if productData was successfully fetched
          // Use productData.category if it exists, otherwise use the first fetched category
          setCategory(productData.category || (fetchedCategories.length > 0 ? fetchedCategories[0] : ''));
        } else if (fetchedCategories.length > 0) { // If no product data but categories exist (shouldn't happen with `return` above)
          setCategory(fetchedCategories[0]);
        }


        const sizesSnap = await getDocs(collection(db, 'sizes'));
        setAvailableSizes(sizesSnap.docs.map(d => d.data().name));

      } catch (e) {
        console.error("خطأ في جلب بيانات المنتج:", e); // Error fetching product data
        toast.error('تعذر تحميل بيانات المنتج.'); // Could not load product data
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id]); // Removed 'categories' from dependency array to prevent infinite loop/re-fetch.
            // The category is initialized based on productData or fetchedCategories only once.

  // Helper to upload images (handles new File objects and existing URLs)
  const uploadImages = async (files) => {
    const uploadedImageUrls = [];
    for (const file of files) {
      if (typeof file === 'string') { // It's an existing URL
        uploadedImageUrls.push(file);
      } else if (file instanceof File) { // It's a new File object
        try {
          const storageRef = ref(storage, `products/${file.name}_${Date.now()}`); // Unique name
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push(downloadURL);
        } catch (uploadError) {
          console.error("خطأ في تحميل الصورة:", uploadError); // Error uploading image
          toast.error(`فشل تحميل الصورة ${file.name}.`); // Failed to upload image
        }
      }
    }
    return uploadedImageUrls;
  };

  // Handlers for color/size variations
  const handleAddStockForSize = (colorIndex = null) => {
    if (!selectedSize || stock === '' || isNaN(parseInt(stock))) {
      toast.error('الرجاء اختيار مقاس وتحديد كمية المخزون.'); // Please select a size and enter stock
      return;
    }

    const stockValue = parseInt(stock, 10);

    if (colorIndex !== null) { // Editing existing color's sizes
      setProductColors(currentColors =>
        currentColors.map((color, idx) =>
          idx === colorIndex
            ? { ...color, sizes: { ...color.sizes, [selectedSize]: stockValue } }
            : color
        )
      );
    } else { // Adding sizes to the 'newColor' being prepared
      setNewColor(prev => ({
        ...prev,
        sizes: { ...prev.sizes, [selectedSize]: stockValue }
      }));
    }
    setSelectedSize('');
    setStock('');
  };

  const handleDeleteStockForSize = (colorIndex, sizeKey) => {
    setProductColors(currentColors =>
      currentColors.map((color, idx) => {
        if (idx === colorIndex) {
          const newSizes = { ...color.sizes };
          delete newSizes[sizeKey];
          return { ...color, sizes: newSizes };
        }
        return color;
      })
    );
  };

  const handleAddColor = () => {
    if (!newColor.colorCode || !newColor.colorName) {
      toast.error('الرجاء إدخال رمز اللون واسمه.'); // Please enter color code and name
      return;
    }
    setProductColors(prevColors => [...prevColors, newColor]);
    setNewColor({ colorCode: '#000000', colorName: '', sizes: {} }); // Reset for next color
    toast.success('تمت إضافة اللون بنجاح.'); // Color added successfully
  };

  const handleDeleteColor = (idx) => {
    setProductColors(prevColors => prevColors.filter((_, i) => i !== idx));
    toast.success('تم حذف اللون.'); // Color deleted
  };

  // Add new global size
  const handleAddAvailableSize = () => {
    if (newSize.trim() && !availableSizes.includes(newSize.trim())) {
      setAvailableSizes(s => [...s, newSize.trim()]);
      setNewSize('');
      toast.success(`تمت إضافة المقاس "${newSize}" للقائمة.`); // Size added to list
    } else if (availableSizes.includes(newSize.trim())) {
      toast.error('هذا المقاس موجود بالفعل.'); // Size already exists
    }
  };

  // Remove an image from the list
  const handleRemoveImage = (indexToRemove) => {
    setImages(currentImages => currentImages.filter((_, idx) => idx !== indexToRemove));
    toast.success('تم حذف الصورة.'); // Image deleted
  };

  // Handle file input for images
  const handleImageFileChange = (e) => {
    // Combine existing images (if they are URLs) with new files
    const newFiles = Array.from(e.target.files);
    // Filter out potential duplicates if user re-selects same files, though uploadImages handles this
    setImages(prevImages => [...prevImages.filter(img => typeof img === 'string'), ...newFiles]);
  };

  // Save changes to product
  const handleSaveProduct = async e => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const imageUrls = await uploadImages(images); // Upload new images, keep old URLs

      let calculatedTotalStock = 0;
      if (existingProduct.variationType === 'simple') {
        calculatedTotalStock = parseInt(stock, 10) || 0;
      } else {
        calculatedTotalStock = productColors
          .flatMap(c => Object.values(c.sizes))
          .reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
      }

      const finalPrice = (parseFloat(price) || 0) - (parseFloat(discount) || 0);

      const updatedProductData = {
        productName,
        description,
        category,
        images: imageUrls,
        price: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        finalPrice: finalPrice,
        totalStock: calculatedTotalStock,
      };

      if (existingProduct.variationType !== 'simple') {
        updatedProductData.productColors = productColors;
      }

      await updateDoc(doc(db, 'products', id), updatedProductData);
      toast.success('تم تحديث المنتج بنجاح!'); // Product updated successfully
    } catch (e) {
      console.error("خطأ في تحديث المنتج:", e); // Error updating product
      toast.error('فشل تحديث المنتج. يرجى المحاولة مرة أخرى.'); // Failed to update product
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <BeatLoader size={30} color="#3B82F6" />
        <p className="mr-4 text-gray-600 text-lg">جارٍ تحميل بيانات المنتج...</p> {/* Loading product data */}
      </div>
    );
  }

  if (!existingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-center text-red-600 text-2xl font-semibold">
          لم يتم العثور على المنتج أو حدث خطأ.
        </p> {/* Product not found or error occurred */}
      </div>
    );
  }

  return (
    <div className="font-poppins bg-gray-100 min-h-screen flex flex-col">
  
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-10 flex-grow rtl" dir="rtl">
        <h1 className='text-3xl md:text-5xl font-extrabold text-gray-900 text-center mb-10'>
          تعديل <span className="text-blue-600">المنتج</span>
        </h1>

        <form onSubmit={handleSaveProduct} className="bg-white p-8 rounded-2xl shadow-xl space-y-8 max-w-4xl mx-auto border border-gray-200">

          {/* Product Basic Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
              <FaBoxes className="inline-block ml-2 text-blue-500" /> معلومات المنتج الأساسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="productName" className="block text-gray-700 text-md font-semibold mb-2">اسم المنتج:</label>
                <input
                  type="text"
                  id="productName"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-gray-700 text-md font-semibold mb-2">الفئة:</label>
                <div className="relative">
                  <select
                    id="category"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 text-md font-semibold mb-2">الوصف:</label>
              <textarea
                id="description"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="أدخل وصفًا للمنتج"
                required
              />
            </div>
          </div>

          {/* Product Images Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
              <FaUpload className="inline-block ml-2 text-blue-500" /> صور المنتج
            </h2>
            <div className="border-dashed border-2 border-gray-300 p-6 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative">
              <input
                type="file"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageFileChange}
                accept="image/*"
              />
              <FaPlus className="text-blue-500 text-3xl mx-auto mb-2" />
              <p className="text-gray-600 font-medium">انقر أو اسحب وإسقاط لتحميل الصور</p>
              <p className="text-gray-500 text-sm">JPG, PNG, GIF (أقصى حجم للملف 5MB)</p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {images.map((img, i) => {
                  const src = typeof img === 'string' ? img : URL.createObjectURL(img);
                  return (
                    <div key={i} className="relative group rounded-lg overflow-hidden shadow-md border border-gray-200">
                      <img src={src} alt={`Product Image ${i + 1}`} className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="حذف الصورة"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Variation Type Specific UI */}
          {existingProduct.variationType === 'simple' ? (
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                <FaBoxes className="inline-block ml-2 text-blue-500" /> إعدادات المنتج البسيط
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="stock" className="block text-gray-700 text-md font-semibold mb-2">الكمية (المخزون):</label>
                  <input
                    type="number"
                    id="stock"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    placeholder="أدخل الكمية المتاحة"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-gray-700 text-md font-semibold mb-2">السعر الأساسي (دج):</label>
                  <input
                    type="number"
                    id="price"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="أدخل السعر الأساسي"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="block text-gray-700 text-md font-semibold mb-2">الخصم (دج):</label>
                  <input
                    type="number"
                    id="discount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="أدخل مبلغ الخصم"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-md font-semibold mb-2">السعر النهائي (دج):</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    value={((parseFloat(price) || 0) - (parseFloat(discount) || 0)).toLocaleString('ar-DZ')}
                    readOnly
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Product Variations (Colors & Sizes) */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                  <FaPalette className="inline-block ml-2 text-blue-500" /> إدارة الألوان والمقاسات
                </h2>

                {/* Add New Color Section */}
                <div className="bg-blue-50 p-6 rounded-lg shadow-inner space-y-4 border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800">إضافة لون جديد</h3>
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex flex-col flex-1">
                      <label htmlFor="newColorName" className="block text-blue-700 text-sm font-medium mb-1">اسم اللون:</label>
                      <input
                        type="text"
                        id="newColorName"
                        placeholder="اسم اللون (مثال: أزرق، أحمر)"
                        value={newColor.colorName}
                        onChange={e => setNewColor(c => ({ ...c, colorName: e.target.value }))}
                        className="p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <label htmlFor="newColorCode" className="block text-blue-700 text-sm font-medium mb-1">رمز اللون:</label>
                      <input
                        type="color"
                        id="newColorCode"
                        value={newColor.colorCode}
                        onChange={e => setNewColor(c => ({ ...c, colorCode: e.target.value }))}
                        className="w-14 h-14 p-1 border-2 border-blue-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="bg-blue-600 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <MdColorLens /> إضافة لون
                    </button>
                  </div>

                  {/* Sizes for New Color */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">إضافة مقاسات للمنتج الجديد</h4>
                    <div className="flex flex-col sm:flex-row items-end gap-3">
                      <div className="relative flex-1">
                        <select
                          value={selectedSize}
                          onChange={e => setSelectedSize(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 appearance-none bg-white"
                        >
                          <option value="">اختر مقاس</option>
                          {availableSizes.map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <input
                        type="number"
                        placeholder="الكمية"
                        value={stock}
                        onChange={e => setStock(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddStockForSize(null)} // null means adding to newColor
                        className="bg-purple-600 text-white px-5 py-3 rounded-lg shadow hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <FaPlus /> إضافة كمية للمقاس
                      </button>
                    </div>
                    {Object.keys(newColor.sizes).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">المقاسات المضافة للون الجديد:</p>
                        <ul className="space-y-1 text-gray-700">
                          {Object.entries(newColor.sizes).map(([sz, q]) => (
                            <li key={sz} className="flex justify-between items-center py-1">
                              <span>{sz}: <span className="font-bold">{q}</span> قطعة</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing Colors Display and Edit */}
                {productColors.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mt-6">الألوان والمقاسات الموجودة:</h3>
                    {productColors.map((color, colorIdx) => (
                      <div key={colorIdx} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.colorCode }}></span>
                            <input
                              type="text"
                              value={color.colorName}
                              onChange={e =>
                                setProductColors(cs =>
                                  cs.map((x, i) =>
                                    i === colorIdx ? { ...x, colorName: e.target.value } : x
                                  )
                                )
                              }
                              className="p-2 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteColor(colorIdx)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-all duration-200 flex items-center gap-1.5 text-sm"
                          >
                            <FaTrash /> حذف اللون
                          </button>
                        </div>
                        <p className="text-gray-700 font-semibold mb-2">المقاسات والمخزون لهذا اللون:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(color.sizes).map(([sizeKey, quantity]) => (
                            <div key={sizeKey} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                              <span className="font-medium text-gray-700">{sizeKey}:</span>
                              <input
                                type="number"
                                value={quantity}
                                onChange={e => handleAddStockForSize(colorIdx, sizeKey, e.target.value)} // Reusing add for update
                                className="p-2 border border-gray-300 rounded-md w-20 text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteStockForSize(colorIdx, sizeKey)}
                                className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-auto"
                                title="حذف المقاس من هذا اللون"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Option to add more sizes to existing color */}
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                           <div className="relative flex-1">
                                <select
                                    value={selectedSize}
                                    onChange={e => setSelectedSize(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 appearance-none bg-white"
                                >
                                    <option value="">اختر مقاس لإضافته</option>
                                    {availableSizes.filter(s => !Object.keys(color.sizes).includes(s)).map(sz => (
                                        <option key={sz} value={sz}>{sz}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <input
                                type="number"
                                placeholder="الكمية"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                                min="0"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddStockForSize(colorIdx)} // Pass color index to add to existing
                                className="bg-green-600 text-white px-5 py-3 rounded-lg shadow hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
                            >
                                <FaPlus /> إضافة مقاس
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Discount for Variational Products */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                      <FaMoneyBillWave className="inline-block ml-2 text-blue-500" /> التسعير
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label htmlFor="price" className="block text-gray-700 text-md font-semibold mb-2">السعر الأساسي (دج):</label>
                          <input
                              type="number"
                              id="price"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              value={price}
                              onChange={e => setPrice(e.target.value)}
                              placeholder="أدخل السعر الأساسي"
                              min="0"
                              required
                          />
                      </div>
                      <div>
                          <label htmlFor="discount" className="block text-gray-700 text-md font-semibold mb-2">الخصم (دج):</label>
                          <input
                              type="number"
                              id="discount"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              value={discount}
                              onChange={e => setDiscount(e.target.value)}
                              placeholder="أدخل مبلغ الخصم"
                              min="0"
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-gray-700 text-md font-semibold mb-2">السعر النهائي (دج):</label>
                          <input
                              type="text"
                              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                              value={((parseFloat(price) || 0) - (parseFloat(discount) || 0)).toLocaleString('ar-DZ')}
                              readOnly
                          />
                      </div>
                  </div>
              </div>

              {/* Global Sizes Management (optional, for adding to 'availableSizes') */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                  <FaRulerCombined className="inline-block ml-2 text-blue-500" /> إدارة المقاسات الكلية
                </h2>
                <div className="bg-purple-50 p-6 rounded-lg shadow-inner space-y-4 border border-purple-200">
                  <h3 className="text-xl font-bold text-purple-800">إضافة مقاس جديد إلى القائمة الكلية</h3>
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex flex-col flex-1">
                      <label htmlFor="newGlobalSize" className="block text-purple-700 text-sm font-medium mb-1">اسم المقاس:</label>
                      <input
                        type="text"
                        id="newGlobalSize"
                        placeholder="مثال: S, M, L, XL"
                        value={newSize}
                        onChange={e => setNewSize(e.target.value)}
                        className="p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAvailableSize}
                      className="bg-purple-600 text-white px-5 py-3 rounded-lg shadow hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <FaPlus /> إضافة مقاس
                    </button>
                  </div>
                  {availableSizes.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">المقاسات الكلية المتاحة:</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                            {availableSizes.map((sz, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                                    {sz}
                                </span>
                            ))}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="text-center pt-8 border-t border-gray-200">
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
              disabled={isLoading} // Disable button while saving
            >
              {isLoading ? <BeatLoader size={10} color="#fff" /> : <FaEdit />}
              {isLoading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'} {/* Saving... / Save Changes */}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default EditProduct;