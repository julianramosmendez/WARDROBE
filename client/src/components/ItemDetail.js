import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ItemDetail.css';

function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to ensure image URLs are correct
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return '';
    }
    
    // If it's already a full URL, use it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5003${imageUrl}`;
    }
    
    // If it's just a filename, add the full path
    return `http://localhost:5003/uploads/${imageUrl}`;
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view item details');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/wardrobe/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Item not found');
        } else {
          throw new Error('Failed to fetch item');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setItem(data.item);
    } catch (err) {
      setError('Error loading item details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to delete items');
        return;
      }

      const response = await fetch(`/api/wardrobe/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Redirect back to wardrobe after successful deletion
      navigate('/');
    } catch (err) {
      setError('Error deleting item');
    }
  };

  if (loading) {
    return (
      <div className="item-detail">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading item details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          {error}
        </div>
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Wardrobe
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Item not found
        </div>
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Wardrobe
        </button>
      </div>
    );
  }

  const imageUrl = getImageUrl(item.imageUrl);

  return (
    <div className="item-detail">
      <div className="item-detail-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Wardrobe
        </button>
        <h1>{item.name}</h1>
      </div>

      <div className="item-detail-content">
        <div className="item-image-container">
          <img 
            src={imageUrl} 
            alt={item.name}
            className="item-detail-image"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="item-info">
          <div className="info-section">
            <h3>Category</h3>
            <p className="category-tag">{item.category}</p>
          </div>

          {item.description && (
            <div className="info-section">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>
          )}

          <div className="info-section">
            <h3>Added</h3>
            <p>{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="item-actions">
            <button 
              onClick={handleDelete}
              className="delete-item-btn"
            >
              🗑️ Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail; 