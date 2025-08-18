import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OutfitBuilder.css';

function OutfitBuilder() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState({
    tops: null,
    bottoms: null,
    shoes: null,
    accessories: []
  });
  const [showOutfit, setShowOutfit] = useState(false);

  // Function to ensure image URLs are correct
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return '';
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5003${imageUrl}`;
    }
    
    return `http://localhost:5003/uploads/${imageUrl}`;
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
      setItems(data.items);
    } catch (err) {
      setError('Error loading wardrobe items');
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (category) => {
    return items.filter(item => item.category === category);
  };

  const selectItem = (item, category) => {
    if (category === 'Accessories') {
      // For accessories, toggle selection (multiple allowed)
      setSelectedOutfit(prev => {
        const currentAccessories = prev.accessories || [];
        const isSelected = currentAccessories.some(acc => acc._id === item._id);
        
        if (isSelected) {
          return {
            ...prev,
            accessories: currentAccessories.filter(acc => acc._id !== item._id)
          };
        } else {
          return {
            ...prev,
            accessories: [...currentAccessories, item]
          };
        }
      });
    } else {
      // For other categories, single selection
      setSelectedOutfit(prev => ({
        ...prev,
        [category.toLowerCase()]: item
      }));
    }
  };

  const isItemSelected = (item, category) => {
    if (category === 'Accessories') {
      return selectedOutfit.accessories?.some(acc => acc._id === item._id) || false;
    }
    return selectedOutfit[category.toLowerCase()]?._id === item._id;
  };

  const clearOutfit = () => {
    setSelectedOutfit({
      tops: null,
      bottoms: null,
      shoes: null,
      accessories: []
    });
    setShowOutfit(false);
  };

  const saveOutfit = async () => {
    // TODO: Implement outfit saving functionality
    alert('Outfit saved! (Feature coming soon)');
  };

  if (loading) {
    return (
      <div className="outfit-builder">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading your wardrobe...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="outfit-builder">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          {error}
        </div>
      </div>
    );
  }

  const categories = ['Tops', 'Bottoms', 'Shoes', 'Accessories'];

  return (
    <div className="outfit-builder">
      <div className="outfit-builder-header">
        <h1>Build Your Outfit</h1>
        <p>Mix and match your wardrobe items to create the perfect outfit!</p>
      </div>

      <div className="outfit-builder-content">
        <div className="outfit-preview">
          <h2>Your Outfit</h2>
          <div className="outfit-display">
            {selectedOutfit.tops && (
              <div className="outfit-item">
                <img src={getImageUrl(selectedOutfit.tops.imageUrl)} alt={selectedOutfit.tops.name} />
                <p>{selectedOutfit.tops.name}</p>
              </div>
            )}
            {selectedOutfit.bottoms && (
              <div className="outfit-item">
                <img src={getImageUrl(selectedOutfit.bottoms.imageUrl)} alt={selectedOutfit.bottoms.name} />
                <p>{selectedOutfit.bottoms.name}</p>
              </div>
            )}
            {selectedOutfit.shoes && (
              <div className="outfit-item">
                <img src={getImageUrl(selectedOutfit.shoes.imageUrl)} alt={selectedOutfit.shoes.name} />
                <p>{selectedOutfit.shoes.name}</p>
              </div>
            )}
            {selectedOutfit.accessories?.map(accessory => (
              <div key={accessory._id} className="outfit-item accessory">
                <img src={getImageUrl(accessory.imageUrl)} alt={accessory.name} />
                <p>{accessory.name}</p>
              </div>
            ))}
            {!selectedOutfit.tops && !selectedOutfit.bottoms && !selectedOutfit.shoes && selectedOutfit.accessories?.length === 0 && (
              <div className="empty-outfit">
                <p>Start building your outfit by selecting items below!</p>
              </div>
            )}
          </div>
          
          <div className="outfit-actions">
            <button onClick={clearOutfit} className="clear-btn">
              Clear Outfit
            </button>
            <button onClick={saveOutfit} className="save-btn">
              Save Outfit
            </button>
          </div>
        </div>

        <div className="wardrobe-section">
          <div className="navigation-buttons">
            <button onClick={() => navigate('/wardrobe')} className="nav-btn">
              📁 My Wardrobe
            </button>
            <button onClick={() => navigate('/upload')} className="nav-btn">
              ➕ Add Item
            </button>
          </div>

          <div className="category-tabs">
            {categories.map(category => (
              <div key={category} className="category-section">
                <h3>{category}</h3>
                <div className="items-grid">
                  {getItemsByCategory(category).length === 0 ? (
                    <div className="no-items">
                      <p>No {category.toLowerCase()} yet.</p>
                      <button onClick={() => navigate('/upload')} className="add-item-btn">
                        Add {category.slice(0, -1)}
                      </button>
                    </div>
                  ) : (
                    getItemsByCategory(category).map(item => (
                      <div
                        key={item._id}
                        className={`item-card ${isItemSelected(item, category) ? 'selected' : ''}`}
                        onClick={() => selectItem(item, category)}
                      >
                        <img 
                          src={getImageUrl(item.imageUrl)} 
                          alt={item.name}
                          onError={(e) => {
                            console.error('Image failed to load:', getImageUrl(item.imageUrl));
                            e.target.style.display = 'none';
                          }}
                        />
                        <h4>{item.name}</h4>
                        {isItemSelected(item, category) && (
                          <div className="selected-indicator">✓</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutfitBuilder; 