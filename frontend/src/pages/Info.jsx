import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import './Info.css';

const Info = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="page-wrapper">
      <div className="info">
        <div className="info__shell container">

          <div className="info__header">
            <button className="info__back" onClick={() => navigate('/home')} aria-label="Back">
              <FiArrowLeft />
            </button>
            <h1 className="info__title">Information</h1>
          </div>

          {/* ── About Us ── */}
          <section id="about" className="info__section">
            <h2 className="info__section-title">About Us</h2>
            <div className="info__card">
              <p>Welcome to <strong>Siri Traders</strong>.</p>
              <p>
                Established on 25 September 2025, Siri Traders is a dedicated e-commerce platform committed to providing high-quality grocery products to both retail and wholesale customers. Our objective is to simplify the grocery procurement process by offering a reliable, efficient, and customer-centric online shopping experience.
              </p>
              <p>
                At Siri Traders, we understand the importance of quality, affordability, and timely access to essential products. We strive to bridge the gap between suppliers and consumers by creating a dependable marketplace that caters to households, businesses, retailers, restaurants, and institutional buyers.
              </p>
              <p>
                Our extensive product portfolio includes a wide range of grocery essentials such as grains, pulses, spices, packaged foods, cooking ingredients, household necessities, and other daily-use products sourced from trusted suppliers.
              </p>
              <p>
                Customer satisfaction remains the foundation of our operations. We are committed to maintaining transparency, consistency, and excellence in every aspect of our business.
              </p>
              <p>
                Our mission is to make grocery shopping seamless, accessible, and dependable while fostering long-term relationships built on trust and integrity.
              </p>
              <p>
                At Siri Traders, we continuously work towards becoming a preferred and trusted destination for quality grocery products by delivering value, convenience, and exceptional service.
              </p>
            </div>
          </section>

          {/* ── Contact ── */}
          <section id="contact" className="info__section">
            <h2 className="info__section-title">Contact Us</h2>
            <div className="info__card">
              <p>We'd love to hear from you! Reach out to us through any of the following channels:</p>
              <div className="info__contact-grid">
                <div className="info__contact-item">
                  <FiPhone className="info__contact-icon" />
                  <div>
                    <strong>Phone</strong>
                    <a href="tel:812570286">812570286</a>
                  </div>
                </div>
                <div className="info__contact-item">
                  <FiMail className="info__contact-icon" />
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:pothineni076@gmail.com">pothineni076@gmail.com</a>
                  </div>
                </div>
                <div className="info__contact-item">
                  <FiMapPin className="info__contact-icon" />
                  <div>
                    <strong>Address</strong>
                    <span>H.no: 10-152, Nagarjuna Colony Road No 12, Chitkul, Isnapur Municipality, Pincode 502307</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Terms & Conditions ── */}
          <section id="terms" className="info__section">
            <h2 className="info__section-title">Terms &amp; Conditions</h2>
            <div className="info__card">
              <p className="info__updated">Last Updated: September 2025</p>
              <p>
                By accessing or using the Siri Traders website, users agree to comply with all applicable laws and these Terms &amp; Conditions.
              </p>
              <p>
                Siri Traders reserves the right to modify product information, pricing, availability, and website content without prior notice. Orders are subject to acceptance, verification, and availability. Users must provide accurate information and refrain from unlawful activities.
              </p>
              <p>
                All intellectual property on the website remains the property of Siri Traders. Any disputes shall be governed by the laws of India.
              </p>
            </div>
          </section>

          {/* ── Privacy Policy ── */}
          <section id="privacy" className="info__section">
            <h2 className="info__section-title">Privacy Policy</h2>
            <div className="info__card">
              <p className="info__updated">Last Updated: September 2025</p>
              <p>
                Siri Traders respects your privacy and is committed to protecting personal information collected through the website.
              </p>
              <p>
                Information collected may include customer details, contact information, billing and shipping addresses, and technical website usage information.
              </p>
              <p>
                The information is used for order processing, customer support, website improvement, fraud prevention, and legal compliance. Siri Traders does not sell or rent customer data and only shares information with authorised service providers when necessary.
              </p>
              <p>
                Appropriate security measures are implemented to protect customer information.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Info;
