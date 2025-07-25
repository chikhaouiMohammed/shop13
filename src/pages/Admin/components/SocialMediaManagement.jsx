import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../Data/firebase';
import toast from 'react-hot-toast';
import {
  FaFacebook,
  FaTwitter, // Changed from FaXTwitter to FaTwitter
  FaInstagram,
  FaTiktok,
  FaEnvelope,
  FaPhoneAlt,
  FaSave
} from 'react-icons/fa'; // Importing relevant icons

const SocialMediaManagement = () => {
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    tiktok: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing social links and contact info from Firestore on component mount
  useEffect(() => {
    const fetchSocialLinks = async () => {
      setIsLoading(true);
      try {
        const contactDocRef = doc(collection(db, 'contact'), 'info');
        const docSnap = await getDoc(contactDocRef);

        if (docSnap.exists()) {
          setSocialLinks(docSnap.data());
        } else {
          console.log("No existing social media links found, using default empty values.");
        }
      } catch (error) {
        console.error('Error fetching social links:', error);
        toast.error('حدث خطأ أثناء تحميل معلومات التواصل.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks(prevLinks => ({
      ...prevLinks,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const contactDocRef = doc(collection(db, 'contact'), 'info');
      await setDoc(contactDocRef, socialLinks);
      console.log('Saved social links and contact info:', socialLinks);
      toast.success('تم حفظ التغييرات بنجاح!');
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast.error('حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-700">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-poppins bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8 rtl" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12 flex items-center justify-center gap-3">
          إدارة <span className="text-blue-600">روابط التواصل الاجتماعي</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Social Media Links Section */}
          <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-3">
              <span className="text-blue-500"><FaFacebook /></span> روابط وسائل التواصل الاجتماعي
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facebook */}
              <div>
                <label htmlFor="facebook" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaFacebook className="text-blue-600" /> فيسبوك
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={socialLinks.facebook}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              {/* X (Twitter) */}
              <div>
                <label htmlFor="twitter" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaTwitter className="text-gray-800" /> إكس (تويتر سابقاً)
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={socialLinks.twitter}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="https://x.com/yourhandle"
                />
              </div>

              {/* Instagram */}
              <div>
                <label htmlFor="instagram" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaInstagram className="text-pink-600" /> إنستغرام
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={socialLinks.instagram}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>

              {/* TikTok */}
              <div>
                <label htmlFor="tiktok" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaTiktok className="text-black" /> تيك توك
                </label>
                <input
                  type="url"
                  id="tiktok"
                  name="tiktok"
                  value={socialLinks.tiktok}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="https://tiktok.com/@youraccount"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-3">
              <span className="text-green-500"><FaEnvelope /></span> معلومات الاتصال
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaEnvelope className="text-green-600" /> البريد الإلكتروني
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={socialLinks.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="بريدك الإلكتروني@مثال.كوم"
                />
              </div>

              {/* Phone Number Input */}
              <div>
                <label htmlFor="phone" className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaPhoneAlt className="text-purple-600" /> رقم الهاتف
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={socialLinks.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="+2137XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold text-xl px-10 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <FaSave /> حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SocialMediaManagement;