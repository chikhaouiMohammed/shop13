import React, { useState, useRef, useEffect } from 'react'; // Added useEffect for consistency
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../../Data/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast'; // Ensure react-hot-toast is installed
import { FaPaintBrush, FaImage, FaCloudUploadAlt, FaUpload, FaSpinner } from 'react-icons/fa'; // Icons for UI
import NavBar from '../../../components/Header/NavBar'; // Assuming NavBar is part of your admin layout
import Footer from '../../../components/Footer/Footer'; // Assuming Footer is part of your admin layout


const Customized = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  // Fetch current logo on mount
  useEffect(() => { // Changed React.useEffect to useEffect for consistency
    const fetchLogo = async () => {
      try {
        const docRef = doc(db, 'customization', 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLogoUrl(docSnap.data().logoUrl || ''); // Ensure it's an empty string if null/undefined
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
        toast.error('فشل تحميل الشعار الحالي.'); // Failed to load current logo.
      }
    };
    fetchLogo();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('الرجاء تحديد شعار لتحميله.'); // Please select a logo to upload.
      return;
    }
    setIsUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `branding/logo_${Date.now()}_${selectedFile.name}`); // Added file name for clarity
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'customization', 'branding'), { logoUrl: url });
      setLogoUrl(url);
      toast.success('تم تحديث الشعار بنجاح!'); // Logo updated successfully!
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error('فشل تحميل الشعار.'); // Failed to upload logo.
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="font-poppins bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8 rtl" dir="rtl">
      {/* Assuming NavBar and Footer are present in your layout */}
      {/* <NavBar /> */}

      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
          <FaPaintBrush className="text-blue-600 text-4xl" />
          تخصيص <span className="text-blue-600">المتجر</span>
        </h2>

        <p className="text-gray-600 mb-8 text-center leading-relaxed">
          قم بتحميل شعارك لتخصيص متجرك. يوصى باستخدام صورة PNG شفافة بحجم 200x60 بكسل.
        </p>

        {/* Current Logo Section */}
        <div className="w-full flex flex-col items-center gap-4 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
          <span className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaImage className="text-purple-500" /> الشعار الحالي
          </span>
          <div className="h-28 flex items-center justify-center w-full bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="الشعار الحالي" className="max-h-24 object-contain mx-auto p-2" />
            ) : (
              <span className="text-gray-400 text-lg">لم يتم تعيين شعار</span>
            )}
          </div>
        </div>

        {/* Upload New Logo Section */}
        <div
          className={`w-full mt-4 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer p-8
            ${dragActive ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
          style={{ minHeight: 180 }}
          onClick={() => inputRef.current && inputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <img src={URL.createObjectURL(selectedFile)} alt="معاينة" className="max-h-24 object-contain rounded-lg shadow-md" />
              <span className="text-gray-700 font-medium text-sm text-center">{selectedFile.name}</span>
              <span className="text-gray-500 text-xs">تم تحديد ملف. انقر لتغييره.</span> {/* File selected. Click to change. */}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <FaCloudUploadAlt className="text-blue-500 text-5xl mb-3" />
              <span className="text-gray-600 text-lg font-medium">اسحب وأفلت أو انقر لتحديد شعار</span>
              <span className="text-gray-500 text-sm">JPG, PNG, GIF (الحد الأقصى للحجم 5 ميجابايت)</span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full py-4 mt-8 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isUploading ? (
            <>
              <FaSpinner className="animate-spin" />
              جارٍ التحميل...
            </>
          ) : (
            <>
              <FaUpload />
              تحميل الشعار الجديد
            </>
          )}
        </button>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default Customized;