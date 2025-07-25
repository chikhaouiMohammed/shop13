import { useState, useEffect } from 'react';
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Data/firebase';

const Footer = () => {
    const [contactInfo, setContactInfo] = useState({
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const contactDocRef = doc(db, 'contact', 'info');
                const contactDoc = await getDoc(contactDocRef);

                if (contactDoc.exists()) {
                    setContactInfo(contactDoc.data());
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching contact info:', error);
            }
        };

        fetchContactInfo();
    }, []);

    const currentYear = new Date().getFullYear();

    return (
        <footer className="container border-t-[0.5px] border-darkGray/20 lg:px-20 px-7 mx-auto py-28 flex md:justify-between justify-center items-center flex-wrap gap-10">
            <p className="text-center text-gray-500">
                &#169; {currentYear} <span className="underline">Shop 13.</span> All rights reserved.
            </p>
            {/* social media icons */}
            <div className="flex justify-center items-center gap-3 md:w-fit w-full">
                {contactInfo.instagram && (
                    <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-lightBeige transition-all duration-200">
                        <FaInstagram style={{ width: '20px', height: '20px' }} />
                    </a>
                )}
                {contactInfo.facebook && (
                    <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-lightBeige transition-all duration-200">
                        <FaFacebook style={{ width: '20px', height: '20px' }} />
                    </a>
                )}
                {contactInfo.tiktok && (
                    <a href={contactInfo.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-lightBeige transition-all duration-200">
                        <FaTiktok style={{ width: '20px', height: '20px' }} />
                    </a>
                )}
            </div>
            {/* Contact Info */}
            <div className="text-center text-gray-500 mt-4">
                {contactInfo.email && <p>Email: <a href={`mailto:${contactInfo.email}`} className="underline">{contactInfo.email}</a></p>}
                {contactInfo.phone && <p>Phone: <a href={`tel:${contactInfo.phone}`} className="underline">{contactInfo.phone}</a></p>}
            </div>
        </footer>
    );
};

export default Footer;
