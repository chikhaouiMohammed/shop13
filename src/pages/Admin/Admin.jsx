import { FiMenu } from 'react-icons/fi';
import { useState } from 'react';
import { IoShareSocialOutline, IoClose } from "react-icons/io5";
import { GoTasklist } from "react-icons/go";
import { MdOutlineShoppingBag } from "react-icons/md";
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
// Importing more specific icons for better UX
import { FaBoxOpen, FaTags, FaCog, FaTruck, FaSignOutAlt, FaHome } from 'react-icons/fa';
// Note: Shipping is a page, not a component used directly here in JSX, so its import is not strictly needed here for rendering.
// import Shipping from './pages/Shipping'; // This import is not used in the JSX of Admin component itself

const Admin = () => {
    const [isMenu, setisMenu] = useState(false);
    let location = useLocation();
    const navigate = useNavigate();
    const pathName = location.pathname;

    // Function to toggle the menu
    const toggleMenu = () => {
        setisMenu(!isMenu);
    };

    const today = new Date();
    // Format date for Arabic display
    const formattedDate = today.toLocaleDateString("ar-DZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/admin-login');
    };

    return (
        <div className='flex min-h-screen bg-gray-100 font-poppins rtl' dir="rtl">
            {/* Menu Toggle Button (visible when sidebar is closed) */}
            {!isMenu && (
                <div className='fixed top-0 right-0 z-30 p-6 md:p-8'>
                    <button
                        onClick={toggleMenu}
                        className='bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
                        aria-label="فتح القائمة"
                    >
                        <FiMenu style={{ width: '1.7rem', height: '1.7rem', color: '#333' }} />
                    </button>
                </div>
            )}

            {/* Overlay for closing sidebar when clicking outside */}
            {isMenu && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" // Dark overlay on mobile
                    onClick={toggleMenu}
                    aria-label="إغلاق القائمة"
                ></div>
            )}

            {/* Sidebar */}
            <div className={`
                fixed top-0 right-0 h-screen w-[280px] bg-white text-gray-800 shadow-2xl z-30
                transform transition-transform duration-300 ease-in-out
                ${isMenu ? 'translate-x-0' : 'translate-x-full'}
                md:translate-x-0 md:static md:shadow-none md:border-r md:border-gray-200
            `}>
                {/* Close icon (visible on mobile when menu is open) */}
                <div className="flex justify-start p-6 md:hidden">
                    <button
                        className="cursor-pointer text-gray-600 hover:text-red-500 transition-colors"
                        onClick={toggleMenu}
                        aria-label="إغلاق"
                    >
                        <IoClose style={{ width: '2rem', height: '2rem' }} />
                    </button>
                </div>

                <div className="flex flex-col items-center py-10 border-b border-gray-200 mb-8">
                    <h1 className="font-extrabold text-3xl text-gray-900">
                        لوحة <span className="text-blue-600">التحكم</span>
                    </h1>
                </div>

                <ul className="w-full flex flex-col items-start justify-center gap-2 px-6 text-lg">
                    {/* Products Link */}
                    <Link
                        to='/admin'
                        onClick={toggleMenu} // Close menu on click for mobile
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName === '/admin' ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <FaBoxOpen className="text-2xl" />
                        المنتجات
                    </Link>

                    {/* Orders Link */}
                    <Link
                        to='/admin/orders'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName.startsWith('/admin/orders') ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <GoTasklist className="text-2xl" />
                        الطلبات
                    </Link>

                    {/* Social Link */}
                    <Link
                        to='/admin/social'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName === '/admin/social' ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <IoShareSocialOutline className="text-2xl" />
                        التواصل الاجتماعي
                    </Link>

                    {/* Categories & Sizes Link */}
                    <Link
                        to='/admin/categories-sizes'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName === '/admin/categories-sizes' ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <FaTags className="text-2xl" />
                        الفئات والمقاسات
                    </Link>

                    {/* Customized Link (assuming it's a settings/config page) */}
                    <Link
                        to='/admin/customized'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName === '/admin/customized' ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <FaCog className="text-2xl" />
                        الإعدادات المخصصة
                    </Link>

                    {/* Shipping Link */}
                    <Link
                        to='/admin/shipping'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            ${pathName === '/admin/shipping' ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-700'}
                        `}
                    >
                        <FaTruck className="text-2xl" />
                        الشحن والتوصيل
                    </Link>

                    {/* My Shop Link (link back to frontend) */}
                    <Link
                        to='/'
                        onClick={toggleMenu}
                        className={`
                            flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                            text-gray-700
                        `}
                    >
                        <FaHome className="text-2xl" />
                        متجري
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`
                            mt-8 flex items-center gap-5 w-full p-3 rounded-xl font-medium
                            bg-red-500 text-white shadow-md
                            transition-all duration-200 hover:bg-red-600 hover:scale-[1.02]
                            focus:outline-none focus:ring-2 focus:ring-red-500
                        `}
                    >
                        <FaSignOutAlt className="text-2xl" />
                        تسجيل الخروج
                    </button>
                </ul>
            </div>

            {/* Content Area */}
            <div className={`flex-grow p-6 md:p-8 transition-all duration-300 ease-in-out
                ${isMenu ? 'md:ml-[280px]' : ''} `}
            >
                {/* Actual date */}
                <p className="w-full text-left text-xl md:text-2xl font-medium text-gray-700 mb-8">
                    {formattedDate}
                </p>
                <Outlet /> {/* Renders the child route component */}
            </div>
        </div>
    );
};

export default Admin;