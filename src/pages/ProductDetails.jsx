import { useEffect, useState, useRef } from 'react';
import { algeriaData } from '../Data/algeriaData';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../Data/firebase';
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { BeatLoader } from 'react-spinners';
import NavBar from '../components/Header/NavBar';
import Footer from '../components/Footer/Footer';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  // Checkout form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // For periodic shake animation
  const [periodicShake, setPeriodicShake] = useState(false);
  // For button hover state
  const [isHovered, setIsHovered] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Only toggle shake if not hovered
      if (!hoverRef.current) {
        setPeriodicShake(prev => !prev);
      } else {
        setPeriodicShake(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { id } = useParams();
  const productId = id;
  const [quantity, setQuantity] = useState(1);
  const [stock, setStock] = useState(10);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [variationType, setVariationType] = useState('');


  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  // Checkout form state
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedBaladia, setSelectedBaladia] = useState('');
  const [shippingPrices, setShippingPrices] = useState({});
  const [shippingPrice, setShippingPrice] = useState('');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);
          setVariationType(data.variationType || '');

          // Set the initial stock and default selectors
          if (data.variationType === 'color-size' && data.productColors.length > 0) {
            setSelectedColor(data.productColors[0].colorName);
            const firstSizes = Object.keys(data.productColors[0].sizes || {});
            setSelectedSize(firstSizes[0] || '');
            setStock(data.productColors[0].sizes[firstSizes[0]] || 0);
          } else if (data.variationType === 'color-only' && data.productColors.length > 0) {
            setSelectedColor(data.productColors[0].colorName);
            setStock(data.productColors[0].quantity || 0);
          } else {
            setStock(data.totalStock || 10);
          }

          // Fetch all products and select 4 random ones
          const productsRef = collection(db, 'products');
          const productsSnapshot = await getDocs(productsRef);
          const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Randomly select 4 products excluding the current one
          const filteredProducts = allProducts.filter(p => p.id !== productId);
          const randomProducts = filteredProducts.sort(() => 0.5 - Math.random()).slice(0, 4);

          setRelatedProducts(randomProducts);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching product details: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    const fetchShippingPrices = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shipping_prices'));
        if (snap.exists()) {
          setShippingPrices(snap.data());
        }
      } catch (e) {
        // Optionally show a toast or error
      }
    };
    fetchShippingPrices();
  }, []);

  useEffect(() => {
    if (!selectedWilaya || !shippingPrices) {
      setShippingPrice('');
      return;
    }
    const wilayaObj = algeriaData.find(w => w.name === selectedWilaya);
    if (wilayaObj) {
      setShippingPrice(shippingPrices[wilayaObj.id] || '');
    } else {
      setShippingPrice('');
    }
  }, [selectedWilaya, shippingPrices]);

  useEffect(() => {
    if (!product) return;
    if (variationType === 'color-size') {
      const colorObj = product.productColors.find(c => c.colorName === selectedColor);
      if (colorObj) {
        const sizeStock = colorObj.sizes[selectedSize];
        setStock(sizeStock || 0);
      } else {
        setStock(0);
      }
    } else if (variationType === 'color-only') {
      const colorObj = product.productColors.find(c => c.colorName === selectedColor);
      setStock(colorObj ? colorObj.quantity : 0);
    } else if (variationType === 'simple') {
      setStock(product.totalStock || 1);
    } else {
      setStock(product.totalStock || 10);
    }
  }, [selectedColor, selectedSize, product, variationType]);

  // Unified quantity change handler for all product types
  const handleQuantityChange = (change) => {
    setQuantity(prevQuantity => {
      let newQuantity = prevQuantity + change;
      if (newQuantity < 1) newQuantity = 1;
      if (newQuantity > stock) newQuantity = stock;
      return newQuantity;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    if (!fullName || !phone || !selectedWilaya || !selectedBaladia) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    // Additional validation for variation-based products
    if (variationType === 'color-only' && !selectedColor) {
      toast.error('يرجى اختيار اللون');
      return;
    }
    if (variationType === 'color-size' && (!selectedColor || !selectedSize)) {
      toast.error('يرجى اختيار اللون والمقاس');
      return;
    }
    if (stock < quantity) {
      toast.error('الكمية المطلوبة تتجاوز المخزون المتوفر');
      return;
    }
    if (quantity < 1) {
      toast.error('يرجى تحديد كمية صحيحة');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = {
        orderDate: new Date(),
        status: 'Pending',
        totalAmount: quantity * (product.finalPrice || product.price) + (Number(shippingPrice) || 0),
        productId,
        productName: product.productName,
        productImage: product.images[0],
        productPrice: product.finalPrice || product.price,
        quantity,
        shippingPrice: Number(shippingPrice) || 0,
        deliveryInfo: {
          fullName,
          phone,
          wilaya: selectedWilaya,
          baladia: selectedBaladia,
        },
      };

      // Conditionally add color and size based on variation type
      if (variationType === 'color-only' || variationType === 'color-size') {
        order.selectedColor = selectedColor;
      }
      if (variationType === 'color-size') {
        order.selectedSize = selectedSize;
      }

      await addDoc(collection(db, 'orders'), order);
      setIsSubmitting(false);
      toast.success('تم إرسال الطلب بنجاح!'); // Success toast
      navigate('/thank-you');
    } catch (error) {
      console.error("Error submitting order: ", error);
      setIsSubmitting(false);
      toast.error('حدث خطأ أثناء إرسال الطلب');
    }
  };


  return (
    <div className="font-poppins">
      <NavBar />
      {isLoading ? (
        <div className="w-full h-screen flex justify-center items-center">
          <BeatLoader size={20} color="#D7CDCC" />
        </div>
      ) : product ? (
        <div className="container mx-auto py-10 px-4 md:px-20">
          <div className="w-full flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Wrap both blocks in a parent div to fix adjacent JSX error */}
            <div className="flex flex-col md:flex-row w-full gap-8">
              {/* Product Images */}
              <div className="w-full md:w-1/2 h-auto">
                {/* For small screens, display images in a slider */}
                <div className="md:mb-10 overflow-hidden rounded-lg">
                  <div className="block md:hidden">
                    <div className="flex overflow-x-scroll no-scrollbar space-x-4">
                      <div className="flex gap-3 w-full">
                        {product.images.map((img, index) => (
                          <Link
                            className="cursor-pointer flex-shrink-0 w-full"
                            to={`/product/images/${productId}`}
                            state={{ images: product.images }}
                            key={index}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${index + 1}`}
                              className="rounded-lg w-full min-w-full object-cover"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* For large devices, display images in the current grid format */}
                  <div className="hidden md:block">
                    <Link to={`/product/images/${productId}`} state={{ images: product.images }}>
                      <img src={product.images[0]} alt="Product" className="rounded-lg" />
                    </Link>
                    <div className="grid grid-cols-2 gap-y-4 mt-4">
                      {product.images.slice(1).map((img, index) => (
                        <Link
                          to={`/product/images/${productId}`}
                          state={{ images: product.images }}
                          key={index}
                          className="max-w-[250px] overflow-hidden rounded-lg"
                        >
                          <img className="w-full" src={img} alt={`Thumbnail ${index + 1}`} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Checkout Form - RTL, styled as screenshot */}
              <div className="w-full md:w-[420px] bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col gap-4 rtl" dir="rtl">
                <h3 className="text-xl font-bold text-center mb-2">{product.productName}</h3> {/* Product name at the top */}
                <h2 className="text-xl font-bold text-center mb-2">استمارة الطلب</h2>
                <div className="bg-gray-50 rounded-lg p-4 mb-2">
                  <p className="text-sm font-semibold mb-2 text-right">الرجاء إدخال معلوماتك الخاصة لتتمكن من الطلب</p>
                  {/* The form tag now correctly handles onSubmit */}
                  <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="الاسم الكامل"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-right"
                        value={fullName}
                        onChange={event => setFullName(event.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <img src="/images/icons/user.svg" alt="user" className="w-5 h-5 opacity-60" />
                      </span>
                    </div>
                    {/* Phone */}
                    <div className="relative" dir="rtl">
                      <input
                        type="text"
                        placeholder="رقم الهاتف"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-500 text-lg placeholder-gray-400 text-right"
                        maxLength={10}
                        value={phone}
                        onChange={event => setPhone(event.target.value.replace(/[^0-9]/g, ''))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <img src="/images/icons/phone.svg" alt="phone" className="w-5 h-5 opacity-60" />
                      </span>
                    </div>
                    {/* Wilaya */}
                    <div className="mb-4">
                      <label className="block mb-2 font-semibold">اختر الولاية</label>
                      <select
                        value={selectedWilaya}
                        onChange={event => setSelectedWilaya(event.target.value)}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Wilaya</option>
                        {algeriaData.map(wilaya => (
                          <option key={wilaya.id} value={wilaya.name}>{wilaya.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Baladia */}
                    <div className="relative">
                      <select
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-right"
                        value={selectedBaladia}
                        onChange={event => setSelectedBaladia(event.target.value)}
                        disabled={!selectedWilaya}
                      >
                        <option value="">Baladia</option>
                        {selectedWilaya &&
                          algeriaData.find(w => w.name === selectedWilaya)?.dairas.map((baladia, idx) => (
                            <option key={idx} value={baladia}>{baladia}</option>
                          ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <img src="/images/icons/building.svg" alt="baladia" className="w-5 h-5 opacity-60" />
                      </span>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 text-right">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">سعر المنتج</span>
                        <span className="flex items-center gap-1 font-semibold text-[#181A1B]">
                          <i className="fa fa-shopping-cart" />
                          DZD {(quantity * (product.finalPrice || product.price)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">سعر التوصيل</span>
                        <span className="flex items-center gap-1 font-semibold">
                          <i className="fa fa-truck" />
                          {shippingPrice ? `DZD ${Number(shippingPrice).toLocaleString()}` : 'غير متوفر'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                        <span className="text-sm font-bold">المجموع</span>
                        <span className="flex items-center gap-1 font-bold text-[#181A1B]">
                          <i className="fa fa-calculator" />
                          DZD {(
                            quantity * (product.finalPrice || product.price) + (Number(shippingPrice) || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Variant Selectors for color/color-size, or just show quantity for simple */}
                    {variationType === 'simple' ? (
                      <div className="flex flex-col gap-4 mt-4">
                        {/* Quantity Selector for simple product */}
                        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-semibold text-[#181A1B]">الكمية</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(-1)}
                              className="w-8 h-8 cursor-pointer rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold disabled:opacity-40 hover:border-[#181A1B]"
                              disabled={quantity <= 1}
                            >-</button>
                            <span
                              className="w-12 text-center border border-gray-200 rounded font-semibold text-lg bg-white"
                              style={{ display: 'inline-block', lineHeight: '2.5rem', height: '2.5rem' }}
                            >{quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex cursor-pointer items-center justify-center text-lg font-bold disabled:opacity-40 hover:border-[#181A1B]"
                              disabled={quantity >= stock}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ) : (variationType && product.productColors && product.productColors.length > 0) ? (
                      <div className="flex flex-col gap-4 mt-4">
                        {/* Color Selector */}
                        <div className="flex flex-col items-end gap-2">
                          <label className="text-base font-bold mb-1">اللون</label>
                          <div className="flex flex-row-reverse gap-3">
                            {product.productColors.map((color, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedColor(color.colorName);
                                  if (variationType === 'color-size') {
                                    const firstSize = Object.keys(color.sizes || {})[0] || '';
                                    setSelectedSize(firstSize);
                                  }
                                }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-150 focus:outline-none
                                  ${selectedColor === color.colorName ? 'border-[#181A1B] ring-2 ring-[#181A1B] scale-110 shadow-lg' : 'border-gray-300 hover:border-[#181A1B]'}`}
                                style={{ backgroundColor: color.colorCode, boxShadow: selectedColor === color.colorName ? '0 2px 8px 0 rgba(0,0,0,0.10)' : 'none' }}
                                aria-label={color.colorName}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Size Selector (only for color-size) */}
                        {variationType === 'color-size' && (
                          <div className="flex flex-col items-end gap-2">
                            <label className="text-base font-bold mb-1">المقاس</label>
                            <div className="flex flex-row-reverse gap-3">
                              {(product.productColors.find(c => c.colorName === selectedColor)?.sizes
                                ? Object.keys(product.productColors.find(c => c.colorName === selectedColor).sizes)
                                : []).map((size, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedSize(size)}
                                    className={`w-12 h-12 flex items-center justify-center rounded-xl border text-lg font-medium transition-all duration-150 focus:outline-none
                                  ${selectedSize === size
                                        ? 'bg-white text-[#181A1B] border-[#181A1B] scale-110 shadow-lg ring-2 ring-[#181A1B]'
                                        : 'bg-white text-gray-900 border-gray-300 hover:border-[#181A1B]'}`}
                                    style={{ minWidth: '3rem', letterSpacing: '0.05em' }}
                                    aria-label={size}
                                  >
                                    {size}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                        {/* Quantity Selector for color/color-size */}
                        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-semibold text-[#181A1B]">الكمية</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
                              className="w-8 h-8 cursor-pointer rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold disabled:opacity-40 hover:border-[#181A1B]"
                              disabled={quantity <= 1}
                            >-</button>
                            <span
                              className="w-12 text-center border border-gray-200 rounded font-semibold text-lg bg-white"
                              style={{ display: 'inline-block', lineHeight: '2.5rem', height: '2.5rem' }}
                            >{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity < stock ? quantity + 1 : stock)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex cursor-pointer items-center justify-center text-lg font-bold disabled:opacity-40 hover:border-[#181A1B]"
                              disabled={quantity >= stock}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {/* Submit Button - MOVED HERE */}
                    <button
                      type="submit"
                      className={`w-full bg-[#181A1B] text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-40 ${periodicShake && !isHovered ? 'animate-shake' : ''}`}
                      disabled={quantity < 1 || isSubmitting}
                      onMouseEnter={() => {
                        setIsHovered(true);
                        hoverRef.current = true;
                        setPeriodicShake(false);
                      }}
                      onMouseLeave={() => {
                        setIsHovered(false);
                        hoverRef.current = false;
                      }}
                    >
                      {isSubmitting ? (
                        <span className="loader mr-2"></span>
                      ) : (
                        <i className="fa fa-check-circle" />
                      )}
                      تأكيد الطلب
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* description */}
          <div className='w-full mt-10'>
            <h3 className='text-2xl font-bold mb-4'>Product description :</h3>
            <p className='font-roboto text-lg leading-5'>{product.description}.</p>
          </div>

          {/* Related Products Section */}
          <div className="py-10">
            <h2 className="text-3xl font-semibold mb-6">Related Products</h2>
            {relatedProducts.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-8 items-center">
                {relatedProducts.map((product, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-[250px] cursor-pointer flex flex-col justify-center items-center gap-5 overflow-hidden"
                  >
                    <div className="relative w-full h-auto">
                      {product.images.length > 0 && (
                        <img
                          className="rounded-2xl w-full h-auto transition-opacity duration-500"
                          src={product.images[0]}
                          alt={product.productName}
                        />
                      )}
                    </div>
                    <div className="w-full flex flex-col justify-center items-start gap-2">
                      <h3 className="text-gray-500 text-base">{product.productName}</h3>
                      {product.finalPrice !== product.price ? (
                        <h2 className="text-gray-400 text-lg line-through">
                          {`DA ${product.price.toFixed(2)} DZD`}
                        </h2>
                      ) : (
                        <h2 className="text-gray-400 h-6 line-through"></h2>
                      )}
                      <h2 className="font-montserrat text-xl font-medium">
                        {`DA ${product.finalPrice?.toFixed(2) || product.price.toFixed(2)} DZD`}
                      </h2>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No related products found.</p>
            )}
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};

export default ProductDetails;