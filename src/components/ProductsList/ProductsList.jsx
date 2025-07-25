import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Data/firebase';
import { BeatLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import { FaTag, FaDollarSign } from 'react-icons/fa'; // Added icons for potential use, though not directly used in the current price display, good to have.


const ProductsList = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Function to fetch products from Firestore
  const fetchProducts = async (category = '') => {
    try {
      setIsLoading(true);
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const filteredProducts = category
        ? productsList.filter(product => product.category === category)
        : productsList;

      const mappedProducts = filteredProducts.map(product => ({
        id: product.id,
        image: product.images || [],
        title: product?.productName || 'No title',
        // Ensure price formatting is clean, use null for unavailable
        price: product?.finalPrice !== undefined && product?.finalPrice !== null
          ? product.finalPrice
          : null,
        oldPrice: product?.discount && product?.price !== undefined && product?.price !== null
          ? product.price
          : null,
        totalStock: product.totalStock
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const fetchedCategories = querySnapshot.docs.map(doc => doc.data().name);
      setCategories(fetchedCategories);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products on component mount
    fetchCategories(); // Fetch categories on component mount
  }, []);

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCategory(category);
    fetchProducts(category);
  };

  const handleMouseEnter = (index) => {
    setHoveredCard(index);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  const handleClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Modern horizontal category selector */}
      <div className="w-full flex flex-col items-center mb-10">
        <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-3">
          <button
            className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-sm border transition-all duration-200 whitespace-nowrap
              ${selectedCategory === '' ? 'bg-[#181A1B] text-white border-[#181A1B] scale-105' : 'bg-white text-gray-800 border-gray-300 hover:border-[#181A1B] hover:text-[#181A1B]'}`}
            onClick={() => handleCategoryChange({ target: { value: '' } })}
          >
            جميع الفئات
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-sm border transition-all duration-200 whitespace-nowrap
                ${selectedCategory === cat ? 'bg-[#181A1B] text-white border-[#181A1B] scale-105' : 'bg-white text-gray-800 border-gray-300 hover:border-[#181A1B] hover:text-[#181A1B]'}`}
              onClick={() => handleCategoryChange({ target: { value: cat } })}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-[50vh] flex justify-center items-center">
          <BeatLoader size={25} color="#181A1B" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 justify-items-center">
          {products.map((product, index) => (
            <div
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(product)}
              className="group cursor-pointer flex flex-col items-center overflow-hidden w-full max-w-[280px] sm:max-w-none transform transition-transform duration-300 hover:scale-103"
            >
              <div className="relative w-full aspect-square bg-white flex items-center justify-center overflow-hidden rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                {/* Image container */}
                {product.image.length > 0 && (
                  <>
                    <img
                      className={`w-full h-full object-cover transition-opacity duration-500 ${hoveredCard === index ? 'opacity-0' : 'opacity-100'}`}
                      src={product.image[0]}
                      alt={product.title}
                    />
                    {product.image.length > 1 && (
                      <img
                        className={`w-full h-full object-cover transition-opacity duration-500 absolute top-0 left-0 ${hoveredCard === index ? 'opacity-100' : 'opacity-0'}`}
                        src={product.image[1]}
                        alt={product.title}
                      />
                    )}
                  </>
                )}
                {/* Sale/Sold Out Tag */}
                {/* Only display the tag if totalStock is 0 */}
                {product.totalStock === 0 && (
                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full text-white text-xs font-semibold
                                  bg-[#181A1B] opacity-90
                                  flex items-center gap-1">
                      <FaTag className="text-white text-xs" />
                      نفد المخزون
                  </div>
                )}
              </div>
              {/* text */}
              <div className="w-full flex flex-col justify-center items-start pt-3 px-1">
                <h3 className={`text-gray-600 text-sm sm:text-base font-medium transition-all duration-300 group-hover:text-[#181A1B] group-hover:underline`}>
                  {product.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {/* Old Price (if exists) */}
                  {product.oldPrice !== null && (
                    <h2 className="text-gray-400 text-sm sm:text-base line-through font-semibold whitespace-nowrap">
                      {`DA ${product.oldPrice.toLocaleString('ar-DZ')} DZD`}
                    </h2>
                  )}
                  {/* Current/Discounted Price */}
                  <h2 className="text-[#181A1B] text-lg sm:text-xl font-bold whitespace-nowrap">
                    {product.price !== null ? `DA ${product.price.toLocaleString('ar-DZ')} DZD` : 'غير متوفر'}
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;