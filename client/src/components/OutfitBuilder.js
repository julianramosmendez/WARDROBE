import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OutfitBuilder.css';

function OutfitBuilder() {
  const navigate = useNavigate();
  const [layeringEnabled, setLayeringEnabled] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState({
    tops: [],
    bottoms: null,
    shoes: null,
    accessories: []
  });
  

  // Function to ensure image URLs are correct
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `http://localhost:5003${imageUrl}`;
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
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (!response.ok) throw new Error('Failed to fetch items');

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

  const navigateCategoryItems = (category, direction) => {
    const categoryItems = getItemsByCategory(category);
    if(categoryItems.length === 0) return null;

    const currentItem = selectedOutfit[category.toLowerCase()];
    const currentIndex = currentItem
      ? categoryItems.findIndex(item => item._id === currentItem._id)
      : -1;

    let newIndex;
    if(direction === 'next'){
      newIndex = (currentIndex + 1) % categoryItems.length;
    } else {
      newIndex = currentIndex === 0 ? categoryItems.length - 1 : currentIndex - 1;
    }

    return categoryItems[newIndex]
  };
 
  const clearOutfit = () => {
    setSelectedOutfit({
      tops: [],
      bottoms: null,
      shoes: null,
      accessories: []
    });
  };

  const addLayer = (category, item) => {
    const categoryKey = category.toLowerCase();
    
    setSelectedOutfit(prev => {
      if(Array.isArray(prev[categoryKey])) {
        return{
          ...prev,
         [categoryKey]: [...prev[categoryKey], item]
        };
    } else {
      return {
        ...prev,
        [categoryKey]: item
    };
  }
});
};

  const removeLayer = (category, index) => {
    setSelectedOutfit(prev => ({
      ...prev,
      [category]: Array.isArray(prev[category])
      ? prev[category].filter((_, i) => i !== index)
      : null
    }));
  };

  const navigateLayer = (category, itemIndex, direction) => {
    const categoryItems = getItemsByCategory(category);
    if (categoryItems.length === 0) return;

    setSelectedOutfit(prev => {
      const currentItems = [...prev[category]];
      const currentItem = currentItems[itemIndex];
      const currentIndex = categoryItems.findIndex(item => item._id === currentItem._id);

      let newIndex;
      if (direction == 'next') {
        newIndex = (currentIndex + 1) % categoryItems.length;
      } else {
        newIndex = currentIndex === 0 ? categoryItems.length - 1 : currentIndex - 1;
      }

      const newItems = [...currentItems];
      newItems[itemIndex] = categoryItems[newIndex];

      return {
        ...prev,
        [category]: newItems
      };
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



  return (
    <div className="outfit-builder">

      {/* layering toggle */}
      <div className="layer-toggle">
        <label>
          <input
            type="checkbox"
            checked={layeringEnabled}
            onChange={() => setLayeringEnabled(!layeringEnabled)}
          />
          Enable Layering
        </label>
      </div>
    
    <div className="outfit-builder-stacked">
      {/* Stacked Outfit Display */}
      
        {/* Tops Section */}
        <div className="outfit-category-stack">
          <span className="category-label-stack">Tops</span>
          
          {selectedOutfit.tops.length > 0 ? (
           selectedOutfit.tops.map((top, idx) => (
            <div key={idx} className="layered-item-container">
              <button
                className="nav-arrow-stack left"
                onClick={() => navigateLayer('tops', idx, 'prev')}
                disabled={getItemsByCategory('Tops').length === 0}
              >
                ‹
              </button>
           <div className="layered-item">
            <img
              src={getImageUrl(top.imageUrl)}
              alt={top.name}
              className="outfit-item stacked"
              />
              <button onClick={() => removeLayer("tops", idx)}>✕</button>
              </div>

              <button
                className="nav-arrow-stack right"
                onClick={() => navigateLayer('tops', idx, 'next')}
                disabled={getItemsByCategory('Tops').length === 0}
              >
                ›
              </button>
            </div>
          ))
        ) :(
          <div className="empty-item-stack">No Top</div>
        )}
        <button 
          className="add-layer-btn"
          onClick={() => {
            const tops = getItemsByCategory("Tops");
            if(tops.length > 0) {
              addLayer("tops", tops[0]);
            }
          }}
        >
            + Add Layer
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

        {/* Accessories Section */}
<div className="outfit-category-stack">
  <span className="category-label-stack">Accessories</span>
  
  {selectedOutfit.accessories.length > 0 ? (
    selectedOutfit.accessories.map( (acc, idx) => (
      
      <div key={idx} className="layered-item-container">
        <button 
          className="nav-arrow-stack left"
          onClick={() => navigateLayer('accessories', idx, 'prev')}
          disabled={getItemsByCategory('Accessories').length === 0}
      >
        ‹
      </button>

      <div className="layered-item">
        <img
          src={getImageUrl(acc.imageUrl)}
          alt={acc.name}
          className="outfit-item stacked"
      />
      <button onClick={() => removeLayer("accessories", idx)}>✕</button>
    </div>
    <button
      className="nav-arrow-stack right"
      onClick={() => navigateLayer('accessories', idx, 'next')}
      disabled={getItemsByCategory('Accessories').length === 0}
    >
      ›
    </button>
    </div>
    ))
  ) : (
    <div className="empty-item-stack"> No Accessories</div>
  
  )}
  <button 
    className="add-layer-btn"
    onClick={() => {
      const accs = getItemsByCategory("Accessories");
      if (accs.length > 0) {
        addLayer("accessories", accs[0]);
      }
    }}
  >
    + Add Layer
  </button>
</div> {/* closses outfit-category-stack */}

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