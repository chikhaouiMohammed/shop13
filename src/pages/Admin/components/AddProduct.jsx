import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, storage } from '../../../Data/firebase'; // Import storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';

const AddProduct = () => {
  // State variables
  const [variationType, setVariationType] = useState('color-size'); // 'color-size', 'color-only', or 'simple'
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [productColors, setProductColors] = useState([]);
  // For color-only, use quantity; for color-size, use sizes object
  const [newColor, setNewColor] = useState({ colorCode: '#000000', colorName: '', sizes: {}, quantity: '' });
  const [selectedSize, setSelectedSize] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState([]); // File objects
  const [imageUploadProgress, setImageUploadProgress] = useState([]); // [{name, progress, url, error}]
  const [price, setPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const fetchedCategories = querySnapshot.docs.map((doc) => doc.data().name);
        setCategories(fetchedCategories);
      } catch (e) {
        toast.error('Error fetching categories: ', e);
      }
    };

    const fetchSizes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'sizes'));
        const fetchedSizes = querySnapshot.docs.map((doc) => doc.data().name);
        setAvailableSizes(fetchedSizes);
      } catch (e) {
        toast.error('Error fetching sizes: ', e);
      }
    };

    fetchCategories();
    fetchSizes();
  }, []);

  const handleAddColor = () => {
    if (newColor.colorCode && newColor.colorName) {
      if (variationType === 'color-only') {
        if (!newColor.quantity || isNaN(newColor.quantity) || Number(newColor.quantity) <= 0) {
          toast.error('Please enter a valid quantity for this color.');
          return;
        }
        setProductColors((prev) => [
          ...prev,
          { ...newColor, sizes: {}, quantity: Number(newColor.quantity) }
        ]);
        setNewColor({ colorCode: '#000000', colorName: '', sizes: {}, quantity: '' });
      } else {
        // For color-size, omit quantity from the color object
        const { quantity, ...colorWithoutQuantity } = newColor;
        setProductColors((prev) => [
          ...prev,
          { ...colorWithoutQuantity }
        ]);
        setNewColor({ colorCode: '#000000', colorName: '', sizes: {}, quantity: '' });
      }
    }
  };

  const handleAddStockForSize = () => {
    if (selectedSize && stock) {
      setNewColor((prev) => ({
        ...prev,
        sizes: { ...prev.sizes, [selectedSize]: stock }
      }));
      setSelectedSize('');
      setStock('');
    }
  };

  const handleEditColor = (index, field, value) => {
    const updatedColors = [...productColors];
    updatedColors[index][field] = value;
    setProductColors(updatedColors);
  };

  const handleEditQuantity = (index, value) => {
    const updatedColors = [...productColors];
    updatedColors[index].quantity = value;
    setProductColors(updatedColors);
  };

  const handleEditSize = (colorIndex, size, newStock) => {
    const updatedColors = [...productColors];
    updatedColors[colorIndex].sizes[size] = newStock;
    setProductColors(updatedColors);
  };

  const handleDeleteSize = (colorIndex, size) => {
    const updatedColors = [...productColors];
    delete updatedColors[colorIndex].sizes[size];
    setProductColors(updatedColors);
  };

  const handleDeleteColor = (index) => {
    const updatedColors = productColors.filter((_, i) => i !== index);
    setProductColors(updatedColors);
  };


  // Only preview images on select
  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    let combined = [...images, ...newFiles];
    // Remove duplicates by name and size
    combined = combined.filter((file, idx, arr) =>
      arr.findIndex(f => f.name === file.name && f.size === file.size) === idx
    );
    if (combined.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      combined = combined.slice(0, 5);
    }
    setImages(combined);
    setImageUploadProgress(combined.map((file) => ({ name: file.name, progress: 0, url: '', error: '' })));
  };

  // Upload all images on save, with progress and a timeout (2 min)
  const uploadAllImages = async () => {
    const { uploadBytesResumable } = await import('firebase/storage');
    const uploadPromises = images.map((file, index) => {
      return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          setImageUploadProgress((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], progress: 0, error: 'Image too large (max 5MB)' };
            return copy;
          });
          toast.error(`Image ${file.name} is too large (max 5MB).`);
          reject(new Error('Image too large'));
          return;
        }
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setImageUploadProgress((prev) => {
              const copy = [...prev];
              copy[index] = { ...copy[index], progress };
              return copy;
            });
          },
          (error) => {
            setImageUploadProgress((prev) => {
              const copy = [...prev];
              copy[index] = { ...copy[index], error: error.message, progress: 0 };
              return copy;
            });
            toast.error(`Failed to upload image: ${file.name}`);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setImageUploadProgress((prev) => {
              const copy = [...prev];
              copy[index] = { ...copy[index], url, progress: 100 };
              return copy;
            });
            resolve(url);
          }
        );
      });
    });
    // Add a timeout for all uploads (2 minutes)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Image upload timed out. Please try again or use smaller images.')), 120000));
    const urls = await Promise.race([
      Promise.all(uploadPromises.map(p => p.catch(() => ''))),
      timeoutPromise
    ]);
    return urls.filter(Boolean);
  };

  const handleSaveProduct = async () => {
    setIsLoading(true);
    let imageUrls = [];
    let errorOccurred = false;
    try {
      // Basic validation
      if (!productName || !description || !category || !price || !finalPrice) {
        toast.error('Please fill in all required fields.');
        errorOccurred = true;
        return;
      }
      if (variationType !== 'simple' && productColors.length === 0) {
        toast.error('Please add at least one color.');
        errorOccurred = true;
        return;
      }
      if (images.length === 0) {
        toast.error('Please upload at least one product image.');
        errorOccurred = true;
        return;
      }
      if (images.length > 5) {
        toast.error('You can upload a maximum of 5 images.');
        errorOccurred = true;
        return;
      }
      setImageUploadProgress(images.map((file) => ({ name: file.name, progress: 0, url: '', error: '' })));
      toast.loading('Uploading images...', { id: 'uploading' });
      try {
        imageUrls = await uploadAllImages();
      } catch (e) {
        toast.dismiss('uploading');
        toast.error(e && e.message ? e.message : 'Image upload failed. Please try again.');
        setIsLoading(false);
        return;
      }
      toast.dismiss('uploading');
      if (imageUrls.length !== images.length) {
        toast.error('Some images failed to upload. Please try again.');
        setIsLoading(false);
        return;
      }

      // Calculate total stock
      let totalStock = 0;
      if (variationType === 'simple') {
        totalStock = Number(stock);
      } else if (variationType === 'color-only') {
        totalStock = productColors.reduce((acc, color) => acc + Number(color.quantity || 0), 0);
      } else {
        totalStock = productColors.reduce((acc, color) => {
          const colorStock = Object.values(color.sizes).reduce(
            (sum, qty) => sum + Number(qty || 0), 0
          );
          return acc + colorStock;
        }, 0);
      }

      // Calculate discount percentage
      const discount = ((price - finalPrice) / price) * 100;

      const product = {
        productName,
        description,
        category,
        variationType,
        images: imageUrls,
        price: parseFloat(price),
        finalPrice: parseFloat(finalPrice),
        discount: parseFloat(discount),
        totalStock: totalStock,
        createdAt: new Date().toISOString(),
        ...(variationType !== 'simple' && { productColors }),
      };

      toast.loading('Saving product...', { id: 'saving' });
      try {
        await Promise.race([
          addDoc(collection(db, 'products'), product),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Saving product timed out.')), 20000))
        ]);
        toast.dismiss('saving');
        toast.success('Product added successfully!');
      } catch (e) {
        toast.dismiss('saving');
        toast.error(e && e.message ? e.message : 'Failed to save product. Please try again.');
        errorOccurred = true;
        return;
      }

      // Reset form after saving
      setProductName('');
      setDescription('');
      setCategory('');
      setProductColors([]);
      setNewColor({ colorCode: '', colorName: '', sizes: {}, quantity: '' });
      setSelectedSize('');
      setStock('');
      setImages([]);
      setImageUploadProgress([]);
      setPrice('');
      setFinalPrice('');
      setVariationType('color-size');
    } catch (e) {
      console.error('Error adding product: ', e);
      toast.error('Something went wrong. Please try again.');
      errorOccurred = true;
    } finally {
      setIsLoading(false);
      toast.dismiss('uploading');
      toast.dismiss('saving');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };
  

  return (
    <div className="container mx-auto md:px-20 px-10 py-6">
      {!isLoading ? (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-10">Add New Product</h2>

          {/* Step 0: Variation Type */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full mr-3 font-bold">0</div>
              <h3 className="text-xl font-semibold">Product Variation Type</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-4">
              <button
                type="button"
                className={`cursor-pointer flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 shadow-sm text-base font-medium focus:outline-none
                  ${variationType === 'color-size' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'}`}
                aria-pressed={variationType === 'color-size'}
                onClick={() => setVariationType('color-size')}
              >
                <span>Color & Size</span>
              </button>
              <button
                type="button"
                className={`cursor-pointer flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 shadow-sm text-base font-medium focus:outline-none
                  ${variationType === 'color-only' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'}`}
                aria-pressed={variationType === 'color-only'}
                onClick={() => setVariationType('color-only')}
              >
                <span>Color Only</span>
              </button>
              <button
                type="button"
                className={`cursor-pointer flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 shadow-sm text-base font-medium focus:outline-none
                  ${variationType === 'simple' ? 'border-gray-800 bg-gray-100 text-gray-900 ring-2 ring-gray-300' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
                aria-pressed={variationType === 'simple'}
                onClick={() => setVariationType('simple')}
              >
                <span>Simple Product</span>
              </button>
            </div>
            </div>
            <span className="text-xs text-gray-500 mt-1">Choose how you want to manage product variations.</span>
          </div>

          {/* Step 1: Basic Info */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-3 font-bold">1</div>
              <h3 className="text-xl font-semibold">Basic Info</h3>
            </div>
            <div className="flex flex-col mb-4">
              <label className="font-semibold mb-1">Product Name</label>
              <input
                type="text"
                className="p-3 border rounded-lg focus:outline-none"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
              <span className="text-xs text-gray-500 mt-1">This will be shown as the product name.</span>
            </div>
            <div className="flex flex-col mb-4">
              <label className="font-semibold mb-1">Description</label>
              <textarea
                className="p-3 border rounded-lg focus:outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
              />
              <span className="text-xs text-gray-500 mt-1">Describe the product in detail.</span>
            </div>
            <div className="flex flex-col mb-4">
              <label className="font-semibold mb-1">Category</label>
              <select
                className="p-3 border rounded-lg mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 mt-1">Choose the category for this product.</span>
            </div>
          </div>

          {/* Step 2: Images */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-3 font-bold">2</div>
              <h3 className="text-xl font-semibold">Product Images</h3>
            </div>
            <div className="flex flex-col mb-2">
              <label className="font-semibold mb-1">Upload Images</label>
              <div className="border border-dashed border-gray-400 rounded-lg p-4 relative bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
                <p className="text-center text-gray-500">
                  Click to upload images (Max 5 images)
                </p>
              </div>
              <span className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG. Max 5 images.</span>
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex justify-center items-center rounded-full focus:outline-none hover:bg-red-600 transition-all"
                      onClick={() => handleRemoveImage(index)}
                    >
                      X
                    </button>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 rounded mt-2">
                      <div
                        className={`h-2 rounded ${imageUploadProgress[index]?.error ? 'bg-red-400' : 'bg-blue-500'}`}
                        style={{ width: `${imageUploadProgress[index]?.progress || 0}%` }}
                      ></div>
                    </div>
                    {imageUploadProgress[index]?.error && (
                      <div className="text-xs text-red-500 mt-1">{imageUploadProgress[index].error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Pricing */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full mr-3 font-bold">3</div>
              <h3 className="text-xl font-semibold">Pricing</h3>
            </div>
            <div className="flex flex-col mb-4">
              <label className="font-semibold mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                className="p-3 border rounded-lg"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter product price"
              />
              <span className="text-xs text-gray-500 mt-1">Set the base price for this product.</span>
            </div>
            <div className="flex flex-col mb-4">
              <label className="font-semibold mb-1">Final Price</label>
              <input
                type="number"
                step="0.01"
                className="p-3 border rounded-lg"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="Enter final price after discount"
              />
              <span className="text-xs text-gray-500 mt-1">If there is a discount, enter the final price here.</span>
            </div>
            {/* Quantity input for simple product */}
            {variationType === 'simple' && (
              <div className="flex flex-col mb-4">
                <label className="font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="p-3 border rounded-lg"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="Enter quantity for this product"
                />
                <span className="text-xs text-gray-500 mt-1">Set the available quantity for this product.</span>
              </div>
            )}
          </div>

          {/* Step 4: Colors & Variations (hide for simple product) */}
          {variationType !== 'simple' && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-3 font-bold">4</div>
                <h3 className="text-xl font-semibold">Colors & {variationType === 'color-size' ? 'Sizes' : 'Quantity'}</h3>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg shadow-inner space-y-4 mb-4">
                <div className="flex flex-col mb-2">
                  <label className="font-semibold mb-1">Color</label>
                  <input
                    type="color"
                    className="w-16 h-10 p-1 rounded-lg border"
                    value={newColor.colorCode}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, colorCode: e.target.value }))
                    }
                  />
                  <span className="text-xs text-gray-500 mt-1">Pick a color for this variant.</span>
                </div>
                <div className="flex flex-col mb-2">
                  <label className="font-semibold mb-1">Color Name</label>
                  <input
                    type="text"
                    className="p-3 border rounded-lg focus:outline-none"
                    value={newColor.colorName}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, colorName: e.target.value }))
                    }
                    placeholder="Enter color name"
                  />
                  <span className="text-xs text-gray-500 mt-1">E.g. Red, Blue, Green...</span>
                </div>
                {variationType === 'color-size' ? (
                  <>
                    <div className="flex flex-col mb-2">
                      <label className="font-semibold mb-1">Select Size & Stock</label>
                      <div className="flex flex-wrap w-full justify-center gap-3 items-center">
                        <select
                          className="p-3 border w-full md:w-fit rounded-lg"
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                        >
                          <option value="">Select Size</option>
                          {availableSizes.map((size, index) => (
                            <option key={index} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="p-3 border w-full md:w-fit rounded-lg"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Stock"
                        />
                        <button
                          type="button"
                          onClick={handleAddStockForSize}
                          className="px-4 py-2 w-full md:w-fit bg-green-500 text-white rounded-lg"
                        >
                          Add Stock
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Choose a size and set its stock, then click Add Stock.</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Added Sizes:</h4>
                      {Object.keys(newColor.sizes).length > 0 ? (
                        <ul className="mt-2">
                          {Object.entries(newColor.sizes).map(([size, qty]) => (
                            <li key={size} className="flex justify-between">
                              <span>{size}</span>
                              <span>{qty} pcs</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400">No sizes added yet.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col mb-2">
                    <label className="font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      className="p-3 border rounded-lg focus:outline-none"
                      value={newColor.quantity}
                      onChange={(e) => setNewColor((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity for this color"
                    />
                    <span className="text-xs text-gray-500 mt-1">Set the quantity for this color.</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Add Color
                </button>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg shadow-inner mt-6 space-y-6">
                <h3 className="text-lg font-semibold">Added Colors</h3>
                {productColors.map((color, colorIndex) => (
                  <div key={colorIndex} className="border-b pb-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <label className="font-semibold mb-1">Color Code:</label>
                          <input
                            type="color"
                            value={color.colorCode}
                            onChange={(e) => handleEditColor(colorIndex, 'colorCode', e.target.value)}
                            className="w-12 h-12 p-1 border rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-semibold mb-1">Color Name:</label>
                          <input
                            type="text"
                            value={color.colorName}
                            onChange={(e) => handleEditColor(colorIndex, 'colorName', e.target.value)}
                            className="p-2 border rounded-lg w-40"
                            placeholder="Enter color name"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteColor(colorIndex)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Delete Color
                      </button>
                    </div>
                    <div className="mt-6">
                      {variationType === 'color-size' ? (
                        <>
                          <h4 className="font-semibold mb-2">Sizes:</h4>
                          <ul className="space-y-2">
                            {Object.entries(color.sizes).map(([size, qty]) => (
                              <li key={size} className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                                <span className="text-lg font-medium">{size}</span>
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => handleEditSize(colorIndex, size, e.target.value)}
                                    className="p-2 border rounded-lg w-20"
                                    placeholder="Qty"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSize(colorIndex, size)}
                                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <label className="font-semibold">Quantity:</label>
                          <input
                            type="number"
                            value={color.quantity}
                            onChange={(e) => handleEditQuantity(colorIndex, e.target.value)}
                            className="p-2 border rounded-lg w-32"
                            placeholder="Qty"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={handleSaveProduct}
              className={`px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all ${
                isLoading || images.length === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={isLoading || images.length === 0}
            >
              {isLoading ? 'Processing...' : 'Save Product'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-96">
          <BeatLoader color="#3498db" />
        </div>
      )}
    </div>
  );
};

export default AddProduct;
