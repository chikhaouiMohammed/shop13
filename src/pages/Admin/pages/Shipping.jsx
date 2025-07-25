import { useState, useEffect } from 'react';
import { algeriaData } from '../../../Data/algeriaData'; // Using the algeriaData as provided by you
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../Data/firebase'; // Ensure this path is correct
import toast from 'react-hot-toast'; // For notifications
import { BeatLoader } from 'react-spinners'; // For loading indicator (install: npm install react-spinners)
import { FaSave, FaMapMarkerAlt, FaTruck } from 'react-icons/fa'; // Icons for UI (install: npm install react-icons)

// Assuming NavBar and Footer are components you have defined elsewhere.
// If not, you'll need to create them or remove these imports.
import NavBar from '../../../components/Header/NavBar';
import Footer from '../../../components/Footer/Footer';


const SHIPPING_DOC = 'shipping_prices';

const Shipping = () => {
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // New state to manage saving button's loading state, independent of initial load
  const [isSaving, setIsSaving] = useState(false); 

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true); // Set loading true when starting fetch
      try {
        const snap = await getDoc(doc(db, 'settings', SHIPPING_DOC));
        if (snap.exists()) {
          setPrices(snap.data());
        } else {
          // If no prices exist, initialize with empty values for all wilayas
          const initialPrices = algeriaData.reduce((acc, wilaya) => {
            acc[wilaya.id] = ''; 
            return acc;
          }, {});
          setPrices(initialPrices);
          console.log("No existing shipping prices found, initialized with empty values.");
        }
      } catch (e) {
        console.error("Failed to load shipping prices:", e);
        toast.error('فشل تحميل أسعار التوصيل.'); // Failed to load shipping prices
      } finally {
        setIsLoading(false); // Set loading false when fetch is complete (success or error)
      }
    };
    fetchPrices();
  }, []);

  const handleChange = (wilayaId, value) => {
    // Original logic: sets value directly (can be empty string or non-numeric)
    setPrices(prev => ({ ...prev, [wilayaId]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true); // Start saving indicator
    try {
      // Original logic: saves current 'prices' state directly
      await setDoc(doc(db, 'settings', SHIPPING_DOC), prices);
      toast.success('تم تحديث أسعار التوصيل بنجاح!'); // Shipping prices updated!
    } catch (e) {
      console.error("Failed to save shipping prices:", e);
      toast.error('فشل حفظ أسعار التوصيل.'); // Failed to save shipping prices
    } finally {
      setIsSaving(false); // End saving indicator
    }
  };

  return (
    <div className="font-poppins bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8 rtl" dir="rtl">
      {/* Assuming NavBar and Footer are present in your layout */}
      {/* <NavBar /> */}

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200">
        <h2 className="text-3xl md:text-5xl font-extrabold text-center text-gray-900 mb-12 flex items-center justify-center gap-3">
          <FaTruck className="text-blue-600 text-4xl md:text-5xl" />
          إدارة <span className="text-blue-600">أسعار التوصيل</span>
        </h2>

        <p className="text-center text-gray-600 text-lg mb-8">
          قم بتعيين أسعار التوصيل لكل ولاية في الجزائر.
        </p>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-60 bg-gray-50 rounded-2xl shadow-inner">
            <BeatLoader size={30} color="#3B82F6" />
            <p className="mt-4 text-gray-600 text-lg">جارٍ تحميل أسعار التوصيل...</p>
          </div>
        ) : (
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {algeriaData.map(wilaya => (
                <div key={wilaya.id} className="flex flex-col gap-2 p-5 rounded-xl bg-gray-50 border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
                  <label htmlFor={`wilaya-${wilaya.id}`} className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-blue-500" /> {wilaya.name}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id={`wilaya-${wilaya.id}`}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                      value={prices[wilaya.id] || ''} // Uses || '' to display empty for undefined/null
                      onChange={e => handleChange(wilaya.id, e.target.value)}
                      placeholder="سعر التوصيل بالدينار الجزائري"
                      min="0" // Ensures only positive numbers can be entered
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">دج</span> {/* DZD currency */}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSave}
                className="px-10 py-4 bg-blue-600 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                disabled={isSaving} // Disable button while saving
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <FaSave /> حفظ الأسعار
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default Shipping;