import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../Data/firebase';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaTag, FaRulerCombined } from 'react-icons/fa'; // Importing relevant icons

const CategoriesSizes = () => {
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newSize, setNewSize] = useState('');

  // Fetch categories and sizes from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesCollection = await getDocs(collection(db, 'categories'));
        const sizesCollection = await getDocs(collection(db, 'sizes'));

        setCategories(categoriesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSizes(sizesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("فشل تحميل الفئات والمقاسات."); // Failed to load categories and sizes.
      }
    };

    fetchData();
  }, []);

  // Add a new category
  const handleAddCategory = async () => {
    if (newCategory.trim()) { // Trim to prevent adding empty or whitespace-only categories
      try {
        const docRef = await addDoc(collection(db, 'categories'), { name: newCategory.trim() });
        setCategories([...categories, { id: docRef.id, name: newCategory.trim() }]);
        setNewCategory('');
        toast.success(`تمت إضافة الفئة "${newCategory.trim()}" بنجاح!`); // The "${newCategory}" category has been added successfully!
      } catch (error) {
        console.error("Error adding category:", error);
        toast.error("فشل في إضافة الفئة."); // Failed to add category.
      }
    } else {
      toast.error("لا يمكن أن يكون اسم الفئة فارغاً."); // Category name cannot be empty.
    }
  };

  // Add a new size
  const handleAddSize = async () => {
    if (newSize.trim()) { // Trim to prevent adding empty or whitespace-only sizes
      try {
        const docRef = await addDoc(collection(db, 'sizes'), { name: newSize.trim() });
        setSizes([...sizes, { id: docRef.id, name: newSize.trim() }]);
        setNewSize('');
        toast.success(`تمت إضافة المقاس "${newSize.trim()}" بنجاح!`); // The "${newSize}" size has been added successfully!
      } catch (error) {
        console.error("Error adding size:", error);
        toast.error("فشل في إضافة المقاس."); // Failed to add size.
      }
    } else {
      toast.error("لا يمكن أن يكون اسم المقاس فارغاً."); // Size name cannot be empty.
    }
  };

  // Delete category or size
  const handleDelete = async (id, type, name) => {
    try {
      const docRef = doc(db, type === 'category' ? 'categories' : 'sizes', id);
      await deleteDoc(docRef);

      if (type === 'category') {
        setCategories(categories.filter(category => category.id !== id));
        toast.success(`تم حذف الفئة "${name}" بنجاح!`); // The "${name}" category has been deleted successfully!
      } else {
        setSizes(sizes.filter(size => size.id !== id));
        toast.success(`تم حذف المقاس "${name}" بنجاح!`); // The "${name}" size has been deleted successfully!
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`فشل في حذف ال${type === 'category' ? 'فئة' : 'مقاس'}.`); // Failed to delete category/size.
    }
  };

  return (
    <div className="font-poppins bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 rtl" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-200">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-10 sm:mb-12 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          إدارة <span className="text-blue-600">الفئات</span> و <span className="text-purple-600">المقاسات</span>
        </h2>

        {/* Categories Section */}
        <div className="mb-10 pb-8 border-b border-gray-200">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full ml-3 sm:ml-4 text-xl font-bold shadow-md flex-shrink-0">
              <FaTag />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">فئات المنتجات</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center mb-4 gap-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-grow w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm text-base sm:text-lg text-right"
              placeholder="أضف فئة منتج جديدة (مثال: إلكترونيات، ملابس)"
            />
            <button
              onClick={handleAddCategory}
              className="px-5 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md flex items-center justify-center gap-2 text-base sm:text-lg font-semibold w-full sm:w-auto"
            >
              <FaPlus /> إضافة فئة
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-5 text-right">أضف فئات جديدة بسهولة لتنظيم منتجاتك. تظهر الفئات في قوائم المنتجات والمرشحات.</p>
          {categories.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 shadow-inner">
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 text-right">الفئات الحالية:</h4>
              <ul className="space-y-2 sm:space-y-3">
                {categories.map((category) => (
                  <li key={category.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:scale-[1.01]">
                    <span className="text-gray-800 font-medium text-base sm:text-lg mb-2 sm:mb-0">{category.name}</span>
                    <button
                      onClick={() => handleDelete(category.id, 'category', category.name)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium shadow-sm w-full sm:w-auto"
                    >
                      <FaTrash /> حذف
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-base sm:text-lg mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">لم تتم إضافة أي فئات بعد. ابدأ بإضافة واحدة!</p>
          )}
        </div>

        {/* Sizes Section */}
        <div>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full ml-3 sm:ml-4 text-xl font-bold shadow-md flex-shrink-0">
              <FaRulerCombined />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">مقاسات المنتجات</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center mb-4 gap-3">
            <input
              type="text"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              className="flex-grow w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm text-base sm:text-lg text-right"
              placeholder="أضف مقاساً جديداً (مثال: S, M, L, XL, 38, 40)"
            />
            <button
              onClick={handleAddSize}
              className="px-5 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 shadow-md flex items-center justify-center gap-2 text-base sm:text-lg font-semibold w-full sm:w-auto"
            >
              <FaPlus /> إضافة مقاس
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-5 text-right">حدد مقاسات متنوعة لمنتجاتك، مفيدة بشكل خاص للملابس والأحذية.</p>
          {sizes.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 shadow-inner">
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 text-right">المقاسات الحالية:</h4>
              <ul className="space-y-2 sm:space-y-3">
                {sizes.map((size) => (
                  <li key={size.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:scale-[1.01]">
                    <span className="text-gray-800 font-medium text-base sm:text-lg mb-2 sm:mb-0">{size.name}</span>
                    <button
                      onClick={() => handleDelete(size.id, 'size', size.name)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium shadow-sm w-full sm:w-auto"
                    >
                      <FaTrash /> حذف
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-base sm:text-lg mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">لم تتم إضافة أي مقاسات بعد. ابدأ بإضافة واحد!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSizes;