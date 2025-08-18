import React, { useState } from 'react';
import './Upload.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tops',
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = ['Tops', 'Bottoms', 'Shoes', 'Accessories'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage('');
    
    try {
      // First, upload the image
      const imageFormData = new FormData();
      imageFormData.append('image', file);
      
      const token = localStorage.getItem('token');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: imageFormData
      });
      
      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadData = await uploadRes.json();
      
      // Check for HEIC warning
      if (uploadData.warning) {
        setMessage(uploadData.warning + ' However, the item was added to your wardrobe.');
      } else if (file && file.name.toLowerCase().endsWith('.heic')) {
        setMessage('HEIC file detected and converted to JPEG for better browser compatibility. Item added successfully!');
      }
      
      // Then, save the item details
      const itemRes = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: uploadData.imageUrl
        })
      });
      
      if (!itemRes.ok) {
        throw new Error('Failed to save item');
      }
      
      if (!uploadData.warning) {
        setMessage('Item added successfully!');
      }
      setFormData({ name: '', category: 'Tops', description: '' });
      setFile(null);
      setPreview(null);
      
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Add New Item to Your Wardrobe</h2>
      <form onSubmit={handleSubmit}>
        <div className="upload-preview">
          {preview ? (
            <img src={preview} alt="Preview" />
          ) : (
            <div className="upload-placeholder">
              <p>No image selected</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image">Select Image:</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Supported formats: JPG, PNG, GIF. HEIC files will be automatically converted to JPEG for better browser compatibility.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="name">Item Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        {message && (
          <div style={{ 
            color: message.includes('Error') ? 'red' : 'green', 
            marginBottom: '1rem',
            padding: '0.5rem',
            borderRadius: '4px',
            backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8'
          }}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? 'Adding...' : 'Add to Wardrobe'}
        </button>
      </form>
    </div>
  );
}

export default Upload; 