import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="contact-page">
      <nav className="contact-nav">
        <Link to="/" className="nav-logo">TeamBuilder</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link active">Contact</Link>
        </div>
      </nav>

      <div className="contact-content">
        <div className="contact-info">
          <h1>Get in Touch</h1>
          <p>Have questions about TeamBuilder? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>

          <div className="contact-details">
            <div className="contact-detail">
              <div className="detail-icon">📧</div>
              <div>
                <h3>Email</h3>
                <p>support@teambuilder.com</p>
              </div>
            </div>

            <div className="contact-detail">
              <div className="detail-icon">📍</div>
              <div>
                <h3>Location</h3>
                <p>United States</p>
              </div>
            </div>

            <div className="contact-detail">
              <div className="detail-icon">💬</div>
              <div>
                <h3>Social</h3>
                <div className="social-links">
                  <a href="#" className="social-link">Twitter</a>
                  <a href="#" className="social-link">LinkedIn</a>
                  <a href="#" className="social-link">Instagram</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          {submitted ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Message Sent!</h2>
              <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h2>Send us a Message</h2>

              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />

              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                required
              />

              <div className="form-group">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your question..."
                  className="form-input form-textarea"
                  rows="5"
                  required
                />
              </div>

              <Button type="submit" variant="primary" block loading={loading}>
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>

      <footer className="contact-footer">
        <p>&copy; 2024 TeamBuilder. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Contact;
