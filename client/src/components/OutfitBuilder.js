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
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

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

  const categories = ['Tops', 'Bottoms', 'Shoes', 'Accessories'];

  const getItemsByCategory = (category) => {
    return items.filter(item => item.category === category);
  };

  const getCurrentCategory = () => {
    return categories[currentCategoryIndex];
  };

  const getCurrentItems = () => {
    return getItemsByCategory(getCurrentCategory());
  };

  const getCurrentItem = () => {
    const currentItems = getCurrentItems();
    return currentItems[currentItemIndex] || null;
  };

  const navigateItems = (direction) => {
    const currentItems = getCurrentItems();
    if (currentItems.length === 0) return;

    if (direction === 'next') {
      setCurrentItemIndex(prev => (prev + 1) % currentItems.length);
    } else {
      setCurrentItemIndex(prev => prev === 0 ? currentItems.length - 1 : prev - 1);
    }
  };

  const navigateCategories = (direction) => {
    if (direction === 'next') {
      setCurrentCategoryIndex(prev => (prev + 1) % categories.length);
    } else {
      setCurrentCategoryIndex(prev => prev === 0 ? categories.length - 1 : prev - 1);
    }
    setCurrentItemIndex(0); // Reset item index when changing categories
  };

  const selectCurrentItem = () => {
    const currentItem = getCurrentItem();
    const currentCategory = getCurrentCategory();
    
    if (!currentItem) return;

    if (currentCategory === 'Accessories') {
      // For accessories, toggle selection (multiple allowed)
      setSelectedOutfit(prev => {
        const currentAccessories = prev.accessories || [];
        const isSelected = currentAccessories.some(acc => acc._id === currentItem._id);
        
        if (isSelected) {
          return {
            ...prev,
            accessories: currentAccessories.filter(acc => acc._id !== currentItem._id)
          };
        } else {
          return {
            ...prev,
            accessories: [...currentAccessories, currentItem]
          };
        }
      });
    } else {
      // For other categories, single selection
      setSelectedOutfit(prev => ({
        ...prev,
        [currentCategory.toLowerCase()]: currentItem
      }));
    }
  };

  const isCurrentItemSelected = () => {
    const currentItem = getCurrentItem();
    const currentCategory = getCurrentCategory();
    
    if (!currentItem) return false;
    
    if (currentCategory === 'Accessories') {
      return selectedOutfit.accessories?.some(acc => acc._id === currentItem._id) || false;
    }
    return selectedOutfit[currentCategory.toLowerCase()]?._id === currentItem._id;
  };

  const clearOutfit = () => {
    setSelectedOutfit({
      tops: null,
      bottoms: null,
      shoes: null,
      accessories: []
    });
  };

  const saveOutfit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save outfits');
        return;
      }

      // Check if at least one item is selected
      if (!selectedOutfit.tops && !selectedOutfit.bottoms && !selectedOutfit.shoes && selectedOutfit.accessories?.length === 0) {
        alert('Please select at least one item to save the outfit');
        return;
      }

      const outfitName = prompt('Enter a name for your outfit:', 'My Outfit');
      if (!outfitName) return;

      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: outfitName,
          tops: selectedOutfit.tops,
          bottoms: selectedOutfit.bottoms,
          shoes: selectedOutfit.shoes,
          accessories: selectedOutfit.accessories
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save outfit');
      }

      const data = await response.json();
      alert('Outfit saved successfully!');
    } catch (err) {
      console.error('Save outfit error:', err);
      alert('Error saving outfit. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="outfit-builder-simple">
        <div className="loading-message">
          Loading your wardrobe...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="outfit-builder-simple">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  const currentItem = getCurrentItem();
  const currentCategory = getCurrentCategory();
  const currentItems = getCurrentItems();

  return (
    <div className="outfit-builder-stacked">
      {/* Stacked Outfit Display */}
      <div className="outfit-stack">
        {/* Tops Section */}
        <div className="outfit-category-stack">
          <button 
            className="nav-arrow-stack left" 
            onClick={() => {
              const topsItems = getItemsByCategory('Tops');
              if (topsItems.length > 0) {
                const currentTopsIndex = selectedOutfit.tops ? 
                  topsItems.findIndex(item => item._id === selectedOutfit.tops._id) : 0;
                const prevIndex = currentTopsIndex === 0 ? topsItems.length - 1 : currentTopsIndex - 1;
                setSelectedOutfit(prev => ({ ...prev, tops: topsItems[prevIndex] }));
              }
            }}
            disabled={getItemsByCategory('Tops').length === 0}
          >
            ‹
          </button>
          
          <div className="outfit-item-stack" onClick={() => {
            const topsItems = getItemsByCategory('Tops');
            if (topsItems.length > 0) {
              if (selectedOutfit.tops) {
                const currentTopsIndex = topsItems.findIndex(item => item._id === selectedOutfit.tops._id);
                const nextIndex = (currentTopsIndex + 1) % topsItems.length;
                setSelectedOutfit(prev => ({ ...prev, tops: topsItems[nextIndex] }));
              } else {
                setSelectedOutfit(prev => ({ ...prev, tops: topsItems[0] }));
              }
            }
          }}>
            {selectedOutfit.tops ? (
              <>
                <img src={getImageUrl(selectedOutfit.tops.imageUrl)} alt={selectedOutfit.tops.name} />
                <span className="category-label-stack">Tops</span>
              </>
            ) : (
              <div className="empty-item-stack">
                <span>No Top</span>
              </div>
            )}
          </div>
          
          <button 
            className="nav-arrow-stack right" 
            onClick={() => {
              const topsItems = getItemsByCategory('Tops');
              if (topsItems.length > 0) {
                if (selectedOutfit.tops) {
                  const currentTopsIndex = topsItems.findIndex(item => item._id === selectedOutfit.tops._id);
                  const nextIndex = (currentTopsIndex + 1) % topsItems.length;
                  setSelectedOutfit(prev => ({ ...prev, tops: topsItems[nextIndex] }));
                } else {
                  setSelectedOutfit(prev => ({ ...prev, tops: topsItems[0] }));
                }
              }
            }}
            disabled={getItemsByCategory('Tops').length === 0}
          >
            ›
          </button>
        </div>

        {/* Bottoms Section */}
        <div className="outfit-category-stack">
          <button 
            className="nav-arrow-stack left" 
            onClick={() => {
              const bottomsItems = getItemsByCategory('Bottoms');
              if (bottomsItems.length > 0) {
                if (selectedOutfit.bottoms) {
                  const currentBottomsIndex = bottomsItems.findIndex(item => item._id === selectedOutfit.bottoms._id);
                  const prevIndex = currentBottomsIndex === 0 ? bottomsItems.length - 1 : currentBottomsIndex - 1;
                  setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[prevIndex] }));
                } else {
                  setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[bottomsItems.length - 1] }));
                }
              }
            }}
            disabled={getItemsByCategory('Bottoms').length === 0}
          >
            ‹
          </button>
          
          <div className="outfit-item-stack" onClick={() => {
            const bottomsItems = getItemsByCategory('Bottoms');
            if (bottomsItems.length > 0) {
              if (selectedOutfit.bottoms) {
                const currentBottomsIndex = bottomsItems.findIndex(item => item._id === selectedOutfit.bottoms._id);
                const nextIndex = (currentBottomsIndex + 1) % bottomsItems.length;
                setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[nextIndex] }));
              } else {
                setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[0] }));
              }
            }
          }}>
            {selectedOutfit.bottoms ? (
              <>
                <img src={getImageUrl(selectedOutfit.bottoms.imageUrl)} alt={selectedOutfit.bottoms.name} />
                <span className="category-label-stack">Bottoms</span>
              </>
            ) : (
              <div className="empty-item-stack">
                <span>No Bottom</span>
              </div>
            )}
          </div>
          
          <button 
            className="nav-arrow-stack right" 
            onClick={() => {
              const bottomsItems = getItemsByCategory('Bottoms');
              if (bottomsItems.length > 0) {
                if (selectedOutfit.bottoms) {
                  const currentBottomsIndex = bottomsItems.findIndex(item => item._id === selectedOutfit.bottoms._id);
                  const nextIndex = (currentBottomsIndex + 1) % bottomsItems.length;
                  setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[nextIndex] }));
                } else {
                  setSelectedOutfit(prev => ({ ...prev, bottoms: bottomsItems[0] }));
                }
              }
            }}
            disabled={getItemsByCategory('Bottoms').length === 0}
          >
            ›
          </button>
        </div>

        {/* Shoes Section */}
        <div className="outfit-category-stack">
          <button 
            className="nav-arrow-stack left" 
            onClick={() => {
              const shoesItems = getItemsByCategory('Shoes');
              if (shoesItems.length > 0) {
                if (selectedOutfit.shoes) {
                  const currentShoesIndex = shoesItems.findIndex(item => item._id === selectedOutfit.shoes._id);
                  const prevIndex = currentShoesIndex === 0 ? shoesItems.length - 1 : currentShoesIndex - 1;
                  setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[prevIndex] }));
                } else {
                  setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[shoesItems.length - 1] }));
                }
              }
            }}
            disabled={getItemsByCategory('Shoes').length === 0}
          >
            ‹
          </button>
          
          <div className="outfit-item-stack" onClick={() => {
            const shoesItems = getItemsByCategory('Shoes');
            if (shoesItems.length > 0) {
              if (selectedOutfit.shoes) {
                const currentShoesIndex = shoesItems.findIndex(item => item._id === selectedOutfit.shoes._id);
                const nextIndex = (currentShoesIndex + 1) % shoesItems.length;
                setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[nextIndex] }));
              } else {
                setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[0] }));
              }
            }
          }}>
            {selectedOutfit.shoes ? (
              <>
                <img src={getImageUrl(selectedOutfit.shoes.imageUrl)} alt={selectedOutfit.shoes.name} />
                <span className="category-label-stack">Shoes</span>
              </>
            ) : (
              <div className="empty-item-stack">
                <span>No Shoes</span>
              </div>
            )}
          </div>
          
          <button 
            className="nav-arrow-stack right" 
            onClick={() => {
              const shoesItems = getItemsByCategory('Shoes');
              if (shoesItems.length > 0) {
                if (selectedOutfit.shoes) {
                  const currentShoesIndex = shoesItems.findIndex(item => item._id === selectedOutfit.shoes._id);
                  const nextIndex = (currentShoesIndex + 1) % shoesItems.length;
                  setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[nextIndex] }));
                } else {
                  setSelectedOutfit(prev => ({ ...prev, shoes: shoesItems[0] }));
                }
              }
            }}
            disabled={getItemsByCategory('Shoes').length === 0}
          >
            ›
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={clearOutfit} className="action-btn clear">
          Clear All
        </button>
        <button onClick={saveOutfit} className="action-btn save">
          Save Outfit
        </button>
      </div>
    </div>
  );
}

export default OutfitBuilder; 