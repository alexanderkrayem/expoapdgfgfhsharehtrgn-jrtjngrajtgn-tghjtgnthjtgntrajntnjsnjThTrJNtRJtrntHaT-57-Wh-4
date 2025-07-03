// src/components/MainPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Search, X, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';




// Import Custom Hooks and All New Components
import { useDebounce } from '../hooks/useDebounce';
import FeaturedSlider from './FeaturedSlider';
import FeaturedSliderSkeleton from './FeaturedSliderSkeleton';
import ProductsTab from './tabs/ProductsTab';
import DealsTab from './tabs/DealsTab';
import SuppliersTab from './tabs/SuppliersTab';
import FavoritesTab from './tabs/FavoritesTab';
import OrdersTab from './tabs/OrdersTab';
import SearchResultsView from './search/SearchResultsView';
import CartSidebar from './cart/CartSidebar';
import MiniCartBar from './cart/MiniCartBar';
import AddressModal from './cart/AddressModal';
import ProductDetailModal from './modals/ProductDetailModal';
import DealDetailModal from './modals/DealDetailModal';
import SupplierDetailModal from './modals/SupplierDetailModal';
import OrderConfirmationModal from './modals/OrderConfirmationModal';
import CitySelectionModal from './modals/CitySelectionModal';
import CityChangePopover from './common/CityChangePopover'; 
// Constants
const PRODUCT_LIMIT_FOR_SEARCH = 10;
const PRODUCTS_PER_PAGE = 12;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVICEABLE_CITIES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al-Quwain', 'Ras Al-Khaimah', 'Fujairah'];

const MainPanel = ({ telegramUser, userProfile, onProfileUpdate }) => {
    // =================================================================
    // 1. STATE MANAGEMENT
    // =================================================================

    // --- Core UI State ---
    const [activeSection, setActiveSection] = useState('exhibitions');
    const [showCart, setShowCart] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(false); // For disabling cart buttons during updates

    // --- Search State ---
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState({ products: { items: [], totalItems: 0 }, deals: [], suppliers: [] });
    const [searchError, setSearchError] = useState(null);
    const [showSearchResultsView, setShowSearchResultsView] = useState(false);

    // --- Cart State ---
    const [cartItems, setCartItems] = useState([]);
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    const [cartError, setCartError] = useState(null);
    const [activeMiniCartItem, setActiveMiniCartItem] = useState(null);
    const [showActiveItemControls, setShowActiveItemControls] = useState(false);

    // --- Products State ---
    const [fetchedProducts, setFetchedProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [productError, setProductError] = useState(null);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [totalProductPages, setTotalProductPages] = useState(1);
    const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);

    // --- Deals State ---
    const [fetchedDeals, setFetchedDeals] = useState([]);
    const [isLoadingDeals, setIsLoadingDeals] = useState(false);
    const [dealError, setDealError] = useState(null);

    // --- Suppliers State ---
    const [fetchedSuppliers, setFetchedSuppliers] = useState([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
    const [supplierError, setSupplierError] = useState(null);

    // --- Favorites State ---
    const [userFavoriteProductIds, setUserFavoriteProductIds] = useState(new Set());
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
    const [fetchedFavoriteProducts, setFetchedFavoriteProducts] = useState([]);
    const [isLoadingFavoritesTab, setIsLoadingFavoritesTab] = useState(false);
    const [favoritesTabError, setFavoritesTabError] = useState(null);

    // --- Orders State ---
    const [fetchedOrders, setFetchedOrders] = useState([]);
    const [isLoadingOrdersTab, setIsLoadingOrdersTab] = useState(false);
    const [ordersTabError, setOrdersTabError] = useState(null);
    const [highlightedOrderId, setHighlightedOrderId] = useState(null);
    
    // --- Featured Items State ---
    const [featuredItemsData, setFeaturedItemsData] = useState([]);
    const [isLoadingFeaturedItems, setIsLoadingFeaturedItems] = useState(true);
    const [featuredItemsError, setFeaturedItemsError] = useState(null);

    // --- Modal & Checkout State ---
    const [showProductDetailModal, setShowProductDetailModal] = useState(false);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [isLoadingProductDetail, setIsLoadingProductDetail] = useState(false);
    const [productDetailError, setProductDetailError] = useState(null);

    const [showDealDetailModal, setShowDealDetailModal] = useState(false);
    const [selectedDealDetails, setSelectedDealDetails] = useState(null);
    const [isLoadingDealDetail, setIsLoadingDealDetail] = useState(false);
    const [dealDetailError, setDealDetailError] = useState(null);

    const [showSupplierDetailModal, setShowSupplierDetailModal] = useState(false);
    const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
    const [isLoadingSupplierDetail, setIsLoadingSupplierDetail] = useState(false);
    const [supplierDetailError, setSupplierDetailError] = useState(null);

    const [showAddressModal, setShowAddressModal] = useState(false);
    
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [addressFormData, setAddressFormData] = useState({ fullName: '', phoneNumber: '', addressLine1: '', addressLine2: '', city: '' });
    
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showOrderConfirmationModal, setShowOrderConfirmationModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
    const selectedCityId = userProfile?.selected_city_id;
    const [isCityPopoverOpen, setIsCityPopoverOpen] = useState(false);


     // =================================================================
    // 2. DATA FETCHING & LOGIC (useEffect, useCallback, Handlers)
    // =================================================================

    // --- Fetch Initial Data ---
    useEffect(() => {
        const fetchInitialProducts = async () => {
          setIsLoadingProducts(true);
          setProductError(null);
          try {
              const apiUrl = `${API_BASE_URL}/api/products?page=1&limit=${PRODUCTS_PER_PAGE}&cityId=${selectedCityId}`;
              const response = await fetch(apiUrl);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const data = await response.json();
              setFetchedProducts(data.items);
              setCurrentProductPage(data.currentPage);
              setTotalProductPages(data.totalPages);
          } catch (error) {
              setProductError(error.message);
          } finally {
              setIsLoadingProducts(false);
          }
        };
         if (selectedCityId) {
        fetchInitialProducts();
          }
    }, [selectedCityId]);

// In src/components/MainPanel.jsx

// [CITY_FILTER] UPDATED useEffect to fetch suppliers by city
useEffect(() => {
    const fetchSuppliers = async () => {
        // Don't run if no city is selected yet
        if (!selectedCityId) return;

        setIsLoadingSuppliers(true);
        setSupplierError(null);
        setFetchedSuppliers([]); // Clear previous results when city changes
        
        try {
            // Append the cityId to the API URL
            const apiUrl = `${API_BASE_URL}/api/suppliers?cityId=${selectedCityId}`;
            console.log("Fetching suppliers from:", apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setFetchedSuppliers(data);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
            setSupplierError(error.message);
        } finally {
            setIsLoadingSuppliers(false);
        }
    };

    fetchSuppliers();
}, [selectedCityId]); // Add selectedCityId to the dependency array

   // In src/components/MainPanel.jsx

// [CITY_FILTER] UPDATED useEffect to fetch featured items by city
useEffect(() => {
const fetchFeaturedItems = async () => {
setIsLoadingFeaturedItems(true);
setFeaturedItemsError(null);
setFeaturedItemsData([]); // Clear previous items before fetching
try {
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/featured-items`;
            console.log("Fetching REAL featured items from:", apiUrl); // Log API call
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Try to get error details
                throw new Error(errorData.error || `Failed to fetch featured items: ${response.statusText}`);
            }
            const data = await response.json(); // This should be an array from your backend
            
            console.log("REAL featured items received:", data); // Log received data
            setFeaturedItemsData(data || []); // Set data, or empty array if data is null/undefined

        } catch (error) {
            console.error("Failed to fetch featured items:", error);
            setFeaturedItemsError(error.message);
            setFeaturedItemsData([]); // Ensure it's an empty array on error
        } finally {
            setIsLoadingFeaturedItems(false);
        }
    };

    fetchFeaturedItems();
}, [import.meta.env.VITE_API_BASE_URL]); // Re-fetch if base URL changes (shouldn't often)
                                      // Add other dependencies if needed (e.g., if featured items depend on user login state, add that user state)

     // --- Fetch Data on Tab Change ---
   // In src/components/MainPanel.jsx

// [CITY_FILTER] UPDATED useEffect to fetch deals by city
useEffect(() => {
    const fetchDealsData = async () => {
        // Don't run if the tab isn't active or if no city is selected yet
        if (activeSection !== 'exhibitions' || !selectedCityId) {
            // If the tab is not active, we can clear old deals to ensure a fresh load next time
            if (activeSection !== 'exhibitions') {
                setFetchedDeals([]);
            }
            return;
        }

        setIsLoadingDeals(true);
        setDealError(null);
        setFetchedDeals([]); // Clear previous results when tab becomes active or city changes

        try {
            // Append the cityId to the API URL
            const apiUrl = `${API_BASE_URL}/api/deals?cityId=${selectedCityId}`;
            console.log("Fetching deals from:", apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch deals');
            const data = await response.json();
            setFetchedDeals(data);
        } catch (error) { 
            setDealError(error.message); 
        } finally { 
            setIsLoadingDeals(false); 
        }
    };

    fetchDealsData();
}, [activeSection, selectedCityId]); // Add selectedCityId to the dependency array
    
    useEffect(() => {
        const fetchUserOrders = async () => {
            if (activeSection === 'orders' && telegramUser?.id) {
                setIsLoadingOrdersTab(true);
                setOrdersTabError(null);
                setFetchedOrders([]); // Clear previous orders
    
                try {
                    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/orders?userId=${telegramUser.id}`;
                    console.log("Fetching user orders from:", apiUrl);
                    const response = await fetch(apiUrl);
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const ordersData = await response.json();
                    setFetchedOrders(ordersData);
                } catch (error) {
                    console.error("Failed to fetch user orders:", error);
                    setOrdersTabError(error.message);
                } finally {
                    setIsLoadingOrdersTab(false);
                }
            }
        };
    
        fetchUserOrders();
    }, [activeSection, telegramUser?.id, import.meta.env.VITE_API_BASE_URL]); // Dependencies
    // --- NEW: useEffect to fetch Deals when 'exhibitions' tab is active ---

     useEffect(() => {
        // Determine if any modal is currently open
        const isAnyModalOpen =
            showProductDetailModal ||
            showDealDetailModal ||
            showSupplierDetailModal ||
            showAddressModal ||
            showOrderConfirmationModal ||
            showCart; // The cart sidebar also acts like a modal

        if (isAnyModalOpen) {
            // When a modal is open, prevent the body from scrolling
            document.body.style.overflow = 'hidden';
        } else {
            // When all modals are closed, restore body scrolling
            document.body.style.overflow = 'auto';
        }

        // Cleanup function to ensure scrolling is restored if the component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [
        showProductDetailModal,
        showDealDetailModal,
        showSupplierDetailModal,
        showAddressModal,
        showOrderConfirmationModal,
        showCart,
    ]); 

    useEffect(() => {
        const fetchFullFavoriteProducts = async () => {
            if (activeSection === 'favorites' && telegramUser?.id) {
                setIsLoadingFavoritesTab(true);
                setFavoritesTabError(null);
                setFetchedFavoriteProducts([]); // Clear previous results
    
                if (userFavoriteProductIds.size === 0) {
                    // No product IDs favorited, so no need to fetch details
                    console.log("No favorite product IDs to fetch details for.");
                    setIsLoadingFavoritesTab(false);
                    return;
                }
    
                try {
                    // Convert Set of IDs to a comma-separated string for the API
                    const idsString = Array.from(userFavoriteProductIds).join(',');
                    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products/batch?ids=${idsString}`;
                    
                    console.log("Fetching full favorite products from:", apiUrl);
                    const response = await fetch(apiUrl);
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const productsData = await response.json();
                    
                    // The backend returns products, but not necessarily in the order of favoriting.
                    // If you want to sort them (e.g., by most recently favorited),
                    // you'd need to store 'added_at' in user_favorites and sort based on that,
                    // or sort by product name, etc. For now, we'll use the order from the API.
                    setFetchedFavoriteProducts(productsData);
    
                } catch (error) {
                    console.error("Failed to fetch full favorite products:", error);
                    setFavoritesTabError(error.message);
                } finally {
                    setIsLoadingFavoritesTab(false);
                }
            }
        };
    
        fetchFullFavoriteProducts();
    
    }, [activeSection, telegramUser?.id, userFavoriteProductIds, import.meta.env.VITE_API_BASE_URL]); // Dependencies

    // --- Fetch User-Specific Data (Cart, Favorites) ---
    const doFetchCart = useCallback(async () => {
        if (!telegramUser?.id) return;
        setIsLoadingCart(true);
        setCartError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart?userId=${telegramUser.id}`);
            if (!response.ok) throw new Error('Failed to fetch cart');
            const data = await response.json();
            setCartItems(data);
        } catch (error) {
            setCartError(error.message);
            setCartItems([]);
        } finally {
            setIsLoadingCart(false);
        }
    }, [telegramUser?.id]);

    useEffect(() => {
        if (telegramUser?.id) {
            doFetchCart();
            // Fetch initial favorite IDs
        } else {
            setCartItems([]);
            setUserFavoriteProductIds(new Set());
        }
    }, [telegramUser?.id, doFetchCart]);

     // --- Search Logic ---
    // In src/components/MainPanel.jsx

// [CITY_FILTER] UPDATED useEffect for search to include cityId
useEffect(() => {
    const performSearch = async () => {
        // Don't run if no city is selected yet
        if (!selectedCityId) return;

        const trimmedTerm = debouncedSearchTerm.trim();
        if (trimmedTerm.length < 3) {
            setShowSearchResultsView(false);
            setSearchResults({ products: { items: [], totalItems: 0 }, deals: [], suppliers: [] });
            return;
        }
        
        setIsSearching(true);
        setSearchError(null);
        setShowSearchResultsView(true);
        
        try {
            // Append the cityId to the API URL
            const apiUrl = `${API_BASE_URL}/api/search?searchTerm=${encodeURIComponent(trimmedTerm)}&cityId=${selectedCityId}&limit=${PRODUCT_LIMIT_FOR_SEARCH}`;
            console.log(`[Search] Searching from: ${apiUrl}`);

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Search request failed');
            const data = await response.json();
            setSearchResults(data.results);
        } catch (error) {
            setSearchError(error.message);
        } finally {
            setIsSearching(false);
        }
    };

    performSearch();
}, [debouncedSearchTerm, selectedCityId]); // Add selectedCityId to the dependency array


    // --- Handler Functions ---
    const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData(prevData => ({
        ...prevData,
        [name]: value
    }));
};
    const handleSearchInputChange = (e) => setSearchTerm(e.target.value);
    const clearSearch = () => {
        setSearchTerm('');
        setShowSearchResultsView(false);
    };

    const addToCart = async (product) => {
        if (!telegramUser?.id) return;
        try {
            await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: telegramUser.id, productId: product.id, quantity: 1 }),
            });
            await doFetchCart();
            setActiveMiniCartItem({ ...product, quantity: cartItems.find(i => i.product_id === product.id)?.quantity || 1 });
            setShowActiveItemControls(true);
        } catch (error) { console.error("Failed to add to cart:", error); }
    };

const handleIncreaseQuantity = async (productId) => {
    if (!telegramUser?.id || !productId) {
        console.error("Cannot increase quantity: Missing user or product ID.");
        return;
    }

    // You can add optimistic UI updates here if you want

    try {
        const apiUrl = `${API_BASE_URL}/api/cart`; // This should be your "add/update" endpoint
        const response = await fetch(apiUrl, {
            method: 'POST', // Or 'PUT', depending on your backend logic
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: telegramUser.id,
                productId: productId,
                quantity: 1 // Assuming this endpoint adds 1 to the existing quantity
            }),
        });

        if (!response.ok) {
            // Log the error response from the backend for better debugging
            const errorData = await response.json().catch(() => ({}));
            console.error("Backend error on increasing quantity:", errorData);
            throw new Error(`Failed to increase quantity: ${response.statusText}`);
        }

        // Refetch the cart to get the latest state from the server
        await doFetchCart();

    } catch (error) {
        console.error("Error increasing quantity:", error);
        // Optionally, refetch cart on error to revert optimistic UI updates
        await doFetchCart();
    }
};

const handleDecreaseQuantity = async (productId) => {
    if (!telegramUser?.id || pendingUpdate) return;

    const itemInCart = cartItems.find(item => item.product_id === productId);
    if (!itemInCart) return;

    if (itemInCart.quantity <= 1) {
        await handleRemoveItem(productId); // still uses optimistic version
    } else {
        // Optimistically update UI
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.product_id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );

        try {
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/cart/item/${productId}?userId=${telegramUser.id}`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newQuantity: itemInCart.quantity - 1 }),
            });
            if (!response.ok) throw new Error(`Failed to decrease quantity: ${response.statusText}`);

            await doFetchCart();
        } catch (error) {
            console.error("Error decreasing quantity:", error);
            alert(`Error: ${error.message}`);
            await doFetchCart(); // rollback
        } finally {
        setPendingUpdate(false);
    }
    }
};


// Function to handle removing an item completely
const handleRemoveItem = async (productId) => {
    if (!telegramUser?.id || pendingUpdate) return;

    // Optimistically remove from cart
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));

    if (showActiveItemControls && activeMiniCartItem?.product_id === productId) {
        setShowActiveItemControls(false);
        setActiveMiniCartItem(null);
    }

    try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/cart/item/${productId}?userId=${telegramUser.id}`;
        const response = await fetch(apiUrl, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to remove item: ${response.statusText}`);

        await doFetchCart();
    } catch (error) {
        console.error("Error removing item:", error);
        alert(`Error: ${error.message}`);
        await doFetchCart(); // rollback
    } finally {
        setPendingUpdate(false);
    }
};

const handleShowProductDetails = async (productId, context = 'default') => {
    if (!productId) return;

    // Reset state for the modal
    setShowProductDetailModal(true);
    setIsLoadingProductDetail(true);
    setProductDetailError(null);
    setSelectedProductDetails(null); // Clear previous details

    // Determine the correct API endpoint based on the context
    const isFromFavorites = context === 'favorites';
    const apiUrl = isFromFavorites
        ? `${API_BASE_URL}/api/favorites/product-details/${productId}`
        : `${API_BASE_URL}/api/products/${productId}`;

    console.log(`[ProductDetails] Fetching from: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to load product details: ${response.statusText}`);
        }
        
        const data = await response.json();

        // The data structure is now different depending on the endpoint
        if (isFromFavorites) {
            // Data from our new endpoint already has the correct structure:
            // { originalProduct, isAvailable, alternatives }
            setSelectedProductDetails(data);
        } else {
            // Data from the old endpoint is just the product, so we wrap it
            // to match the structure our modal now expects.
            setSelectedProductDetails({
                originalProduct: data,
                isAvailable: data.stock_level > 0, // Availability is based on stock
                alternatives: []
            });
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        setProductDetailError(error.message);
    } finally {
        setIsLoadingProductDetail(false);
    }
};

const handleSelectAlternativeProduct = (productId) => {
    // Close the current modal and open a new one for the selected alternative
    setShowProductDetailModal(false);
    
    // Use a short timeout to allow the close animation to start before opening the new one
    setTimeout(() => {
        // Call the detail handler in 'default' mode for the new product,
        // so it doesn't try to find more alternatives.
        handleShowProductDetails(productId, 'default');
    }, 200);
};

    const handleShowDealDetails = async (dealId) => {
    if (!dealId) return;

    console.log(`Fetching details for deal ID: ${dealId}`);
    setShowDealDetailModal(true);
    setIsLoadingDealDetail(true);
    setDealDetailError(null);
    setSelectedDealDetails(null);

    try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/deals/${dealId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            if (response.status === 404) throw new Error("العرض غير موجود أو لم يعد فعالاً.");
            throw new Error(`فشل تحميل تفاصيل العرض: ${response.statusText}`);
        }
        const data = await response.json();
        setSelectedDealDetails(data);
    } catch (error) {
        console.error("Error fetching deal details:", error);
        setDealDetailError(error.message);
    } finally {
        setIsLoadingDealDetail(false);
    }
};

const handleShowSupplierDetails = async (supplierId) => {
    if (!supplierId) return;

    console.log(`Fetching details for supplier ID: ${supplierId}`);
    setShowSupplierDetailModal(true);
    setIsLoadingSupplierDetail(true);
    setSupplierDetailError(null);
    setSelectedSupplierDetails(null);

    try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/suppliers/${supplierId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            if (response.status === 404) throw new Error("المورد غير موجود.");
            throw new Error(`فشل تحميل تفاصيل المورد: ${response.statusText}`);
        }
        const data = await response.json();
        setSelectedSupplierDetails(data);
    } catch (error) {
        console.error("Error fetching supplier details:", error);
        setSupplierDetailError(error.message);
    } finally {
        setIsLoadingSupplierDetail(false);
    }
};

const handleToggleFavorite = async (productId) => {
    if (!telegramUser?.id || isLoadingFavorites) return; // Prevent action if no user or still loading initial favs

    const isCurrentlyFavorite = userFavoriteProductIds.has(productId);
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    // For DELETE, productId is in path; for POST, it's in body
    const apiUrl = isCurrentlyFavorite
        ? `${import.meta.env.VITE_API_BASE_URL}/api/favorites/${productId}?userId=${telegramUser.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/favorites`;

    // Optimistically update UI first for better responsiveness
    const newFavoriteProductIds = new Set(userFavoriteProductIds);
    if (isCurrentlyFavorite) {
        newFavoriteProductIds.delete(productId);
    } else {
        newFavoriteProductIds.add(productId);
    }
    setUserFavoriteProductIds(newFavoriteProductIds);

    try {
        const body = method === 'POST' ? JSON.stringify({ userId: telegramUser.id, productId }) : null;
        const headers = method === 'POST' ? { 'Content-Type': 'application/json' } : {};

        const response = await fetch(apiUrl, { method, headers, body });

        if (!response.ok) {
            // Revert optimistic update on error
            setUserFavoriteProductIds(new Set(userFavoriteProductIds)); // Revert to original
            throw new Error(`Failed to ${isCurrentlyFavorite ? 'remove' : 'add'} favorite`);
        }
        // Backend confirmed, UI is already updated. Could log success.
        console.log(`Product ${productId} ${isCurrentlyFavorite ? 'removed from' : 'added to'} favorites successfully.`);

    } catch (error) {
        console.error("Error toggling favorite:", error);
        // Revert optimistic update on error
        setUserFavoriteProductIds(new Set(userFavoriteProductIds)); // Revert to original
        alert(`Error: ${error.message}`);
    }
};

const handleLoadMoreProducts = async () => {
    if (isLoadingMoreProducts || currentProductPage >= totalProductPages) {
        return; // Don't fetch if already loading or no more pages
    }

    setIsLoadingMoreProducts(true);
    setProductError(null); // Clear previous errors

    const nextPage = currentProductPage + 1;

    try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products?page=${nextPage}&limit=${PRODUCTS_PER_PAGE}`;
        // TODO LATER: Add searchTerm and category params here too, consistent with initial fetch

        console.log("Loading more products from:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // --- Append new products to the existing list ---
        setFetchedProducts(prevProducts => [...prevProducts, ...data.items]);
        setCurrentProductPage(data.currentPage);
        // totalProductPages should remain the same, but good to update if backend recalculates
        setTotalProductPages(data.totalPages);

    } catch (error) {
        console.error("Failed to load more products:", error);
        setProductError(error.message); // You might want a separate error state for "load more"
    } finally {
        setIsLoadingMoreProducts(false);
    }
};

const handleCheckout = async () => {
        if (!telegramUser?.id || cartItems.length === 0) {
            alert("User information not available or cart is empty.");
            return;
        }

        setShowAddressModal(false);
        setProfileError(null);

        // Check the profile prop passed down from App.jsx
        if (userProfile && userProfile.full_name && userProfile.phone_number && userProfile.address_line1 && userProfile.city) {
            console.log("Profile is complete. Proceeding directly to create order.");
            await proceedToCreateOrder();
        } else {
            console.log("Profile is incomplete, showing address modal for completion.");
            setAddressFormData({
                fullName: userProfile?.full_name || `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim(),
                phoneNumber: userProfile?.phone_number || '',
                addressLine1: userProfile?.address_line1 || '',
                addressLine2: userProfile?.address_line2 || '',
                city:userProfile?.address_city_text || userProfile?.selected_city_name || '',
            });
            setShowAddressModal(true);
        }
    };



const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!telegramUser?.id) return;

        setIsPlacingOrder(true);
        setProfileError(null);

        try {
            const apiUrl = `${API_BASE_URL}/api/user/profile`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: telegramUser.id,
                    ...addressFormData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            // --- THIS IS THE KEY ---
            // 1. Call the function passed down from App.jsx to trigger a profile refetch.
            onProfileUpdate();
            
            // 2. Close the modal.
            setShowAddressModal(false);

            // 3. Now that the profile is saved, proceed to create the order.
            await proceedToCreateOrder();

        } catch (error) {
            console.error("Error saving profile:", error);
            setProfileError(error.message); // Show error in the modal
        } finally {
            setIsPlacingOrder(false);
        }
    };

const proceedToCreateOrder = async () => {
    if (!telegramUser?.id) {
        alert("Cannot create order: User information missing.");
        return;
    }
    if (cartItems.length === 0) {
        alert("Cannot create order: Your cart is empty.");
        return;
    }

    setIsPlacingOrder(true);
    // Consider clearing profileError here if it's shared with the modal
    // setProfileError(null);

    try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/orders`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: telegramUser.id }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to create order." }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const orderResult = await response.json();
        console.log("Order created:", orderResult);
setHighlightedOrderId(orderResult.orderId);
        setConfirmedOrderDetails(orderResult); // Store order details for the modal
setShowOrderConfirmationModal(true);  // Show the confirmation modal

setCartItems([]);       // Clear the cart in the UI
setShowCart(false);     // Close the cart sidebar
        // Optionally, close the Mini App or navigate to a success page
        // if (window.Telegram?.WebApp) {
        //     window.Telegram.WebApp.close();
        // }

    } catch (error) {
        console.error("Error creating order:", error);
        alert(`فشل في إنشاء الطلب: ${error.message}`);
    } finally {
        setIsPlacingOrder(false);
    }
};
const handleCityChange = async (city) => {
        if (!telegramUser || !city) return;
        try {
            await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: telegramUser.id, selected_city_id: city.id }),
            });
            // Trigger the profile refresh in App.jsx
            onProfileUpdate();
        } catch (err) {
            console.error("Failed to change city:", err);
        }
    };


const handleViewAllSupplierProducts = (supplierName) => {
        setShowSupplierDetailModal(false);
        setSearchTerm(supplierName);
    };

   // =================================================================
    // 3. RENDER METHOD
    // =================================================================
    return (
        <div className="min-h-screen bg-gray-50 overflow-y-auto h-full" dir="rtl">
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 shadow-sm">
                <div className="p-4 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-800">معرض المستلزمات الطبية</h1>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="relative">
    <button
        onClick={() => setIsCityPopoverOpen(prev => !prev)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors max-w-[160px]"
        title="Change City"
    >
        {/* Icon is now first for better alignment */}
        <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />

        {/* 
            THIS IS THE CORRECTED SPAN:
            The `hidden` and `sm:inline` classes have been removed.
            The `truncate` class is added to handle long city names gracefully.
        */}
        <span className="truncate">
            {userProfile?.selected_city_name || 'اختر مدينة'}
        </span>

    </button>
    
    <AnimatePresence>
        {isCityPopoverOpen && (
            <CityChangePopover
                apiBaseUrl={API_BASE_URL}
                currentCityId={userProfile?.selected_city_id}
                onCitySelect={handleCityChange}
                onClose={() => setIsCityPopoverOpen(false)}
            />
        )}
    </AnimatePresence>
</div>
                        <button onClick={() => setShowCart(true)} className="relative p-2 text-gray-600 hover:text-blue-600">
                            <ShoppingCart className="h-6 w-6" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                    </div>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="ابحث عن منتجات, عروض, أو موردين..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        {searchTerm && (
                            <button onClick={clearSearch} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {!showSearchResultsView && (
                        <nav className="flex gap-2 border-b border-gray-200">
                             {['exhibitions', 'products', 'suppliers', 'favorites', 'orders'].map(section => (
                                <button key={section} onClick={() => setActiveSection(section)} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSection === section ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {section === 'exhibitions' && 'العروض'}
                                    {section === 'products' && 'المنتجات'}
                                    {section === 'suppliers' && 'الموردون'}
                                    {section === 'favorites' && 'المفضلة'}
                                    {section === 'orders' && 'طلباتي'}
                                </button>
                            ))}
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 max-w-4xl mx-auto pb-32">
                {showSearchResultsView ? (
                    <SearchResultsView
                        searchTerm={debouncedSearchTerm}
                        isSearching={isSearching}
                        error={searchError}
                        results={searchResults}
                        onShowProductDetails={handleShowProductDetails}
                        onShowDealDetails={handleShowDealDetails}
                        onShowSupplierDetails={handleShowSupplierDetails}
                        onAddToCart={addToCart}
                        onToggleFavorite={handleToggleFavorite}
                        userFavoriteProductIds={userFavoriteProductIds}
                    />
                ) : (
                    <>
 
 {!showSearchResultsView && ( // Only render this block if not in search view
    <div className="featured-container my-6">
        {/*
          This logic now works because FeaturedSlider will correctly
          show the skeleton when isLoading is true.
        */}
        {featuredItemsError ? (
            // State 1: We have an error. Highest priority after loading.
            <div className="text-center py-10 text-red-500">
                <p>خطأ في تحميل العروض المميزة: {featuredItemsError}</p>
            </div>
        ) : (
            // If no error, we render the slider component.
            // It will internally decide to show the skeleton or the real slider.
            <FeaturedSlider
                isLoading={isLoadingFeaturedItems}
                items={featuredItemsData}
                onSlideClick={(item) => {
                    if (item.type === 'product' && item.id) handleShowProductDetails(item.id);
                    else if (item.type === 'deal' && item.id) handleShowDealDetails(item.id);
                    else if (item.type === 'supplier' && item.id) handleShowSupplierDetails(item.id);
                }}
            />
        )}
        
    </div>
)}                       
                        {activeSection === 'exhibitions' && <DealsTab deals={fetchedDeals} isLoading={isLoadingDeals} error={dealError} onShowDetails={handleShowDealDetails} />}
                        {activeSection === 'products' && <ProductsTab products={fetchedProducts} isLoading={isLoadingProducts} error={productError} onLoadMore={handleLoadMoreProducts} hasMorePages={currentProductPage < totalProductPages} isLoadingMore={isLoadingMoreProducts} onAddToCart={addToCart} onToggleFavorite={handleToggleFavorite} onShowDetails={handleShowProductDetails} favoriteProductIds={userFavoriteProductIds} />}
                        {activeSection === 'suppliers' && <SuppliersTab suppliers={fetchedSuppliers} isLoading={isLoadingSuppliers} error={supplierError} onShowDetails={handleShowSupplierDetails} />}
                        {activeSection === 'favorites' && <FavoritesTab favoriteProducts={fetchedFavoriteProducts} isLoading={isLoadingFavoritesTab} error={favoritesTabError} onAddToCart={addToCart} onToggleFavorite={handleToggleFavorite} onShowDetails={handleShowProductDetails} favoriteProductIds={userFavoriteProductIds} />}
                        {activeSection === 'orders' && <OrdersTab orders={fetchedOrders} isLoading={isLoadingOrdersTab} error={ordersTabError} highlightedOrderId={highlightedOrderId} />}
                    </>
                )}
            </main>

            {/* Overlays, Sidebars, and Modals with Unique Keys */}
            <AnimatePresence>
                {(cartItems.length > 0 || showActiveItemControls) && (
                    <MiniCartBar
                        key="mini-cart-bar"
                        cartItems={cartItems}
                        showActiveItemControls={showActiveItemControls}
                        activeMiniCartItem={activeMiniCartItem}
                        onIncrease={handleIncreaseQuantity}
                        onDecrease={handleDecreaseQuantity}
                        onRemove={handleRemoveItem}
                        onHideActiveItem={() => setShowActiveItemControls(false)}
                        onViewCart={() => {
                            setShowActiveItemControls(false);
                            setActiveMiniCartItem(null);
                            setShowCart(true);
                        }}
                    />
                )}
                
                {showCart && (
                    <CartSidebar
                        key="cart-sidebar"
                        show={showCart}
                        onClose={() => setShowCart(false)}
                        cartItems={cartItems}
                        isLoading={isLoadingCart}
                        error={cartError}
                        onIncrease={handleIncreaseQuantity}
                        onDecrease={handleDecreaseQuantity}
                        onRemove={handleRemoveItem}
                        onCheckout={handleCheckout}
                        isPlacingOrder={isPlacingOrder || isLoadingProfile}
                        pendingUpdate={pendingUpdate}
                    />
                )}
                
                {showAddressModal && (
                    <AddressModal
                        key="address-modal"
                        show={showAddressModal}
                        onClose={() => {
                            setShowAddressModal(false);
                            setIsPlacingOrder(false);
                        }}
                        formData={addressFormData}
                        onFormChange={handleAddressFormChange}
                        onFormSubmit={handleSaveProfile}
                        error={profileError}
                        isSaving={isPlacingOrder}
                        availableCities={SERVICEABLE_CITIES}
                    />
                )}
                
                {showProductDetailModal && (
                    <ProductDetailModal
                        key="product-detail-modal"
                        show={showProductDetailModal}
                        onClose={() => setShowProductDetailModal(false)}
                        productData={selectedProductDetails}
                        isLoading={isLoadingProductDetail}
                        error={productDetailError}
                        onAddToCart={addToCart}
                         onToggleFavorite={{
                toggle: handleToggleFavorite,
                isFavorite: (id) => userFavoriteProductIds.has(id)
            }}
             onSelectAlternative={handleSelectAlternativeProduct} 
                        
                    
                    />
                )}
                
                {showDealDetailModal && (
                    <DealDetailModal
                        key="deal-detail-modal"
                        show={showDealDetailModal}
                        onClose={() => setShowDealDetailModal(false)}
                        deal={selectedDealDetails}
                        isLoading={isLoadingDealDetail}
                        error={dealDetailError}
                        onProductClick={(id) => {
                            setShowDealDetailModal(false);
                            handleShowProductDetails(id);
                        }}
                    />
                )}
                
                {showSupplierDetailModal && (
                    <SupplierDetailModal
                        key="supplier-detail-modal"
                        show={showSupplierDetailModal}
                        onClose={() => setShowSupplierDetailModal(false)}
                        supplier={selectedSupplierDetails}
                        isLoading={isLoadingSupplierDetail}
                        error={supplierDetailError}
                        onProductClick={(id) => {
                            setShowSupplierDetailModal(false);
                            handleShowProductDetails(id);
                        }}
                        onViewAllProducts={handleViewAllSupplierProducts}
                        onAddToCart={addToCart}
                        onToggleFavorite={handleToggleFavorite}
                        userFavoriteProductIds={userFavoriteProductIds}
                    />
                )}
                
                {showOrderConfirmationModal && (
                    <OrderConfirmationModal
                        key="order-confirmation-modal"
                        show={showOrderConfirmationModal}
                        onClose={() => {
                            setShowOrderConfirmationModal(false);
                            setActiveSection('orders');
                    
                        }}
                        orderDetails={confirmedOrderDetails}
                    />
                )}
            </AnimatePresence>
        </div>
    );
    };

export default MainPanel;