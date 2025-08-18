import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wardrobe.css';

function Wardrobe() {
  const navigate = useNavigate();
  const [categories] = useState(['Tops', 'Bottoms', 'Shoes', 'Accessories']);
  const [selectedCategory, setSelectedCategory] = useState('Tops');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Function to ensure image URLs are correct
  const getImageUrl = (imageUrl) => {
    console.log('Original imageUrl:', imageUrl);
    
    if (!imageUrl) {
      console.log('No imageUrl provided');
      return '';
    }
    
    // If it's already a full URL, use it
    if (imageUrl.startsWith('http')) {
      console.log('Using full URL:', imageUrl);
      return imageUrl;
    }
    
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/uploads/')) {
      const fullUrl = `http://localhost:5003${imageUrl}`;
      console.log('Converting relative to absolute:', fullUrl);
      return fullUrl;
    }
    
    // If it's just a filename, add the full path
    const fullUrl = `http://localhost:5003/uploads/${imageUrl}`;
    console.log('Adding full path:', fullUrl);
    return fullUrl;
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your wardrobe');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/wardrobe', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const data = await response.json();
      console.log('Fetched items:', data.items); // Debug log
      setItems(data.items);
    } catch (err) {
      setError('Error loading wardrobe items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => item.category === selectedCategory);

  const handleDelete = async (itemId) => {
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

      // Remove the item from the local state
      setItems(items.filter(item => item._id !== itemId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Error deleting item');
    }
  };

  if (loading) {
    return (
      <div className="wardrobe">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading your wardrobe...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wardrobe">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="wardrobe">
      <div className="categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="items-grid">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <p>No items in this category yet.</p>
            <p>Click "Upload Item" to add some clothing!</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const imageUrl = getImageUrl(item.imageUrl);
            console.log('Rendering item:', item.name, 'with image:', imageUrl); // Debug log
            return (
              <div key={item._id} className="item-card">
                <div 
                  className="item-card-content"
                  onClick={() => navigate(`/item/${item._id}`)}
                  title="Click to view details"
                >
                  <img 
                    src={imageUrl} 
                    alt={item.name}
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  />
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                
                {/* Delete button */}
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when clicking delete
                    setDeleteConfirm(item._id);
                  }}
                  title="Delete this item"
                >
                  🗑️ Delete
                </button>
                
                {/* Confirmation dialog */}
                {deleteConfirm === item._id && (
                  <div className="delete-confirmation">
                    <div className="confirmation-content">
                      <p>Are you sure you want to delete "{item.name}"?</p>
                      <p>This action cannot be undone.</p>
                      <div className="confirmation-buttons">
                        <button 
                          className="confirm-delete-btn"
                          onClick={() => handleDelete(item._id)}
                        >
                          Yes, Delete
                        </button>
                        <button 
                          className="cancel-delete-btn"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Wardrobe; 