// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import MainPanel from './components/MainPanel';
import CitySelectionModal from './components/modals/CitySelectionModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [telegramUser, setTelegramUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // The function to fetch the profile is already a useCallback, which is great.
  const fetchUserProfile = useCallback(async (user) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile?userId=${user.id}`);
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
      } else if (response.status === 404) {
        setUserProfile({ user_id: user.id, selected_city_id: null });
      } else {
        throw new Error('Failed to fetch profile.');
      }
    } catch (err) {
      setError('Could not load your profile. Please try refreshing.');
    } finally {
      // Only set loading to false after the initial fetch
      if (isLoading) setIsLoading(false);
    }
  }, [isLoading]); // Dependency on isLoading to avoid infinite loops on re-fetch

  // This is the function we will pass down to MainPanel
  const handleProfileUpdate = useCallback(() => {
    // Simply re-run the fetch function to get the latest data from the server
    if (telegramUser) {
        console.log("[App.jsx] A profile update was triggered. Refetching profile...");
        fetchUserProfile(telegramUser);
    }
  }, [telegramUser, fetchUserProfile]);


  // Effect to initialize the app and get the user
  useEffect(() => {
    // ... (Your existing useEffect for initializing the user is correct and does not need to change)
    const tg = window.Telegram?.WebApp;
    let user;
    if (tg) {
        tg.ready(); tg.expand();
        user = tg.initDataUnsafe?.user;
    }
    if (!user) {
        user = { id: 123456789, first_name: 'Local', last_name: 'Dev' };
    }
    setTelegramUser(user);
    fetchUserProfile(user);
  }, [fetchUserProfile]);


  const handleCitySelect = async ({ cityId }) => {
    if (!telegramUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: telegramUser.id, selected_city_id: cityId }),
      });
      if (!response.ok) throw new Error('Failed to save city selection.');
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      setError("Could not save your city selection. Please try again.");
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><p>Loading...</p></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><p>{error}</p></div>;
  }
  if (userProfile && !userProfile.selected_city_id) {
    return <CitySelectionModal show={true} onCitySelect={handleCitySelect} apiBaseUrl={API_BASE_URL} />;
  }
  if (userProfile && userProfile.selected_city_id) {
    return (
      <div className="App">
        <MainPanel
          telegramUser={telegramUser}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate} // <<< PASS THE UPDATE FUNCTION AS A PROP
        />
      </div>
    );
  }
  return null;
}

export default App;