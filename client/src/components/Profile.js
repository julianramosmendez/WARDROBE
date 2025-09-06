import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    fetchSavedOutfits();
  }, []);

  const fetchSavedOutfits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your saved outfits');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/outfits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved outfits');
      }

      const data = await response.json();
      setSavedOutfits(data.outfits || []);
    } catch (err) {
      setError('Error loading saved outfits');
    } finally {
      setLoading(false);
    }
  };

  const deleteOutfit = async (outfitId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }

      // Remove the outfit from the local state
      setSavedOutfits(prev => prev.filter(outfit => outfit._id !== outfitId));
    } catch (err) {
      setError('Error deleting outfit');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-message">
          Loading your saved outfits...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Saved Outfits</h1>
        <p>View and manage your favorite outfit combinations</p>
      </div>

      {savedOutfits.length === 0 ? (
        <div className="no-outfits">
          <h2>No saved outfits yet</h2>
          <p>Start building outfits to see them here!</p>
          <button onClick={() => navigate('/')} className="create-outfit-btn">
            Create Your First Outfit
          </button>
        </div>
      ) : (
        <div className="outfits-grid">
          {savedOutfits.map(outfit => (
            <div key={outfit._id} className="outfit-card">
              <div className="outfit-preview">
                <div className="outfit-items-preview">
                  {outfit.tops && (
                    <div className="preview-item">
                      <img src={getImageUrl(outfit.tops.imageUrl)} alt={outfit.tops.name} />
                      <span>Top</span>
                    </div>
                  )}
                  {outfit.bottoms && (
                    <div className="preview-item">
                      <img src={getImageUrl(outfit.bottoms.imageUrl)} alt={outfit.bottoms.name} />
                      <span>Bottom</span>
                    </div>
                  )}
                  {outfit.shoes && (
                    <div className="preview-item">
                      <img src={getImageUrl(outfit.shoes.imageUrl)} alt={outfit.shoes.name} />
                      <span>Shoes</span>
                    </div>
                  )}
                  {outfit.accessories && outfit.accessories.length > 0 && (
                    <div className="preview-item">
                      <img src={getImageUrl(outfit.accessories[0].imageUrl)} alt={outfit.accessories[0].name} />
                      <span>Accessory</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="outfit-info">
                <h3>{outfit.name || 'Untitled Outfit'}</h3>
                <p className="outfit-date">
                  {new Date(outfit.createdAt).toLocaleDateString()}
                </p>
                <div className="outfit-actions">
                  <button 
                    onClick={() => deleteOutfit(outfit._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;
