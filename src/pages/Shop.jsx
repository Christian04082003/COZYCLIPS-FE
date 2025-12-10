import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { Gift, Star, Sparkles, Trophy, Flame, Zap, Brain, Clock, Shield, Book, Target, ShoppingCart } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import MoneyIcon from '../assets/coins.png';

// Use relative /api path for local development (proxied via vite.config.js)
// For production, this will be served from the same domain
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://czc-eight.vercel.app" 
  : "";
const API_BASE = BASE_URL ? `${BASE_URL}/api` : "/api";

const ICONS = { Gift, Star, Sparkles, Trophy, Flame, Zap, Brain, Clock, Shield, Book, Target };

// --- Helper Functions and Components ---

const getRarityColor = (rarity) => {
  const colors = {
    common: 'from-gray-400 to-gray-500',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500',
  };
  return colors[rarity] || colors.common;
};

const ConfirmDialog = ({ open, title, onConfirm, onCancel, confirmLabel = 'Confirm', children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        <div className="text-sm text-gray-700 mb-5">{children}</div>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded-md bg-gray-200" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-gradient-to-r from-yellow-600 to-red-600 text-white hover:from-yellow-700 hover:to-red-700" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

const WarningDialog = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-bold mb-3 text-red-600">Warning</h2>
        <p className="text-gray-700 mb-5">{message}</p>
        <button
          className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-md font-semibold hover:from-yellow-700 hover:to-red-700"
          onClick={onClose}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

const SuccessDialog = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-bold mb-3 text-green-600">Success!</h2>
        <p className="text-gray-700 mb-5">{message}</p>
        <button
          className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-md font-semibold hover:from-yellow-700 hover:to-red-700"
          onClick={onClose}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

// --- Main Shop Component ---

const Shop = () => {
  const [userCoins, setCoins] = useState(0);
  const [activeTab, setActiveTab] = useState('abilities');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [abilities, setAbilities] = useState([]);
  const [coinPackages, setCoinPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasedAbilities, setPurchasedAbilities] = useState([]);
  const [searchParams] = useSearchParams();

  // Coin logic
  const addCoins = (amount) => {
    setCoins((c) => {
      const updated = c + amount;
      localStorage.setItem("coins", updated);
      window.dispatchEvent(new Event("storage"));
      return updated;
    });
  };

  const spendCoins = (amount) => {
    setCoins((c) => {
      const updated = Math.max(0, c - amount);
      localStorage.setItem("coins", updated);
      window.dispatchEvent(new Event("storage"));
      return updated;
    });
  };

  // Initial setup: load coins and check URL tab
  useEffect(() => {
    const storedCoins = localStorage.getItem("coins");
    if (storedCoins) setCoins(parseInt(storedCoins, 10));

    const nextTab = searchParams.get('tab') === 'coins' ? 'coins' : 'abilities';
    setActiveTab(nextTab);
  }, [searchParams]);

  // Data fetching logic with local fallback
  const fetchConfig = async (key) => {
    // Fetch from backend API
    if (key === 'abilities') {
      try {
        const response = await fetch(`${API_BASE}/shop`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch abilities: ${response.status}`);
        }
        
        const result = await response.json();
        // Map backend data to expected format (assuming it returns an array of items)
        return result.data?.items || result.data || [];
      } catch (error) {
        console.error('Error fetching abilities from backend:', error);
        return [];
      }
    }
    
    // Coin packages remain hardcoded for now
    if (key === 'coinPackages') {
      return [
        { id: 'c-100', coins: 100, price: 100, discountPercent: 10, highlight: true, icon: 'Gift' },
        { id: 'c-500', coins: 500, price: 500, discountPercent: 10, highlight: false, icon: 'Trophy' },
        { id: 'c-1000', coins: 1000, price: 1000, discountPercent: 10, highlight: false, icon: 'Star' },
      ];
    }
  };

  // Buy ability handler
  const handleBuyAbility = (ability) => {
    if (userCoins < ability.cost) {
      setWarningMessage('Not enough coins!');
      setWarningOpen(true);
      return;
    }
    setConfirmData({ type: 'ability', item: ability });
    setConfirmOpen(true);
  };

  // Open confirm dialog for coins
  const openConfirmCoins = (pkg) => {
    setConfirmData({ type: 'coins', item: pkg });
    setConfirmOpen(true);
  };

  // Effect to load data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [pkgData, abilityData] = await Promise.all([
          fetchConfig('coinPackages'),
          fetchConfig('abilities'),
        ]);

        const pkgsWithIcons = pkgData.map((p) => {
          const Icon = ICONS[p.icon] || Gift;
          // Calculate discounted price for display
          const discountedPrice = Math.round(p.price * (1 - p.discountPercent / 100));
          return { ...p, icon: <Icon className="w-6 h-6" />, discountedPrice };
        });

        const abilitiesWithIcons = abilityData.map((a) => {
          const Icon = ICONS[a.icon] || Zap;
          return { ...a, icon: <Icon className="w-6 h-6" /> };
        });

        if (isMounted) {
          setCoinPackages(pkgsWithIcons);
          setAbilities(abilitiesWithIcons);
          setError('');
        }
      } catch {
        if (isMounted) setError('Failed to load shop data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    // Cleanup function for unmounting
    return () => { isMounted = false; };
  }, []);

  // Handler for confirmed purchase
  const handleConfirmPurchase = async () => {
    if (!confirmData) return;

    if (confirmData.type === 'ability') {
      const ability = confirmData.item;
      
      try {
        // Get auth token from localStorage
        const raw = localStorage.getItem("czc_auth");
        const parsed = raw ? JSON.parse(raw) : {};
        const token = parsed?.token || parsed?.accessToken || parsed?.idToken || parsed?.data?.token;
        
        console.log("Purchase attempt - Token exists:", !!token, "Item:", ability.id);
        
        if (!token) {
          setWarningMessage('Authentication required to purchase items');
          setWarningOpen(true);
          setConfirmOpen(false);
          return;
        }

        // Call backend to redeem item
        console.log("Calling redeem endpoint:", `${API_BASE}/shop/redeem`);
        const response = await fetch(`${API_BASE}/shop/redeem`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemId: ability.id })
        });

        const data = await response.json();
        console.log("Redeem response:", response.status, data);

        if (response.ok && data.success) {
          // Update local state on success
          spendCoins(ability.cost);
          setPurchasedAbilities([...purchasedAbilities, ability.id]);
          setSuccessMessage(`You successfully purchased ${ability.name}!`);
        } else {
          setWarningMessage(data.message || 'Failed to purchase item');
          setWarningOpen(true);
          setConfirmOpen(false);
          return;
        }
      } catch (err) {
        console.error('Error purchasing item:', err);
        setWarningMessage('Error purchasing item: ' + err.message);
        setWarningOpen(true);
        setConfirmOpen(false);
        return;
      }
    } else if (confirmData.type === 'coins') {
      const pkg = confirmData.item;
      // Note: This is client-side coin adding. In a real app, coin purchases
      // would be handled by a secure payment gateway on the backend.
      addCoins(pkg.coins);
      setSuccessMessage(`You successfully purchased ${pkg.coins} coins!`);
    }

    setConfirmOpen(false);
    setSuccessOpen(true);
  };

  // --- Rendered JSX ---

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <DashboardNavbar />
      <div className="flex-1 overflow-auto min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-16">
        <div className="max-w-[calc(100%-40px)] mx-auto px-4 py-8">

          {/* Tab Buttons */}
          <div className="flex gap-3 mb-12 flex-wrap justify-start">
            <button
              onClick={() => setActiveTab('abilities')}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all transform hover:scale-105 ${
                activeTab === 'abilities'
                  ? 'bg-gradient-to-r from-yellow-600 to-red-600 text-white shadow-lg'
                  : 'bg-white text-red-600 hover:bg-red-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6" />
                Buy Abilities
              </div>
            </button>

            <button
              onClick={() => setActiveTab('coins')}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all transform hover:scale-105 ${
                activeTab === 'coins'
                  ? 'bg-gradient-to-r from-yellow-600 to-red-600 text-white shadow-lg'
                  : 'bg-white text-red-600 hover:bg-red-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6" />
                Buy Coins
              </div>
            </button>
          </div>

          {/* Abilities Shop Grid */}
          {!loading && !error && activeTab === 'abilities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-5">
              {abilities.map((ability) => (
                <div
                  key={ability.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all p-2"
                >
                  <div className={`bg-gradient-to-br ${getRarityColor(ability.rarity)} p-2 text-center rounded-lg`}>
                    <div className="bg-white rounded-full p-2 inline-block mb-2 shadow">
                      <div className="text-red-600">{ability.icon}</div>
                    </div>
                    <h3 className="text-white font-bold text-base">{ability.name}</h3>
                    <p className="text-white text-xs uppercase tracking-wide mt-1 opacity-90">{ability.rarity}</p>
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-gray-700 text-sm mb-2 min-h-[30px] font-bold">{ability.description}</p>
                    <div className="flex items-center justify-center gap-1 mb-2 text-base font-bold">
                      <img src={MoneyIcon} alt="Coins" className="w-4 h-4 object-contain" />
                      <span>{ability.cost}</span>
                    </div>
                    <button
                      onClick={() => handleBuyAbility(ability)}
                      className="w-3/4 py-2 mx-auto rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-yellow-600 to-red-600 text-white hover:from-yellow-700 hover:to-red-700 shadow-sm hover:shadow-md block"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Coin Packages Shop Grid */}
          {!loading && !error && activeTab === 'coins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-5">
              {coinPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden p-2 transform hover:scale-105 transition-all
                    ${pkg.highlight ? 'border-4 border-yellow-600' : 'border border-gray-200'}
                    min-h-[270px] 
                  `}
                >
                  <div className="bg-gradient-to-br from-amber-400 to-yellow-500 p-2 text-center rounded-lg relative">
                    {pkg.discountPercent && pkg.highlight && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-600 to-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        {pkg.discountPercent}% OFF
                      </div>
                    )}

                    <div className="bg-white rounded-full p-2 inline-block mb-2 shadow">
                      <div className="text-yellow-600">{pkg.icon}</div>
                    </div>

                    <h3 className="text-white font-bold text-base">{pkg.coins} Coins</h3>
                  </div>

                  <div className="p-2 text-center">
                    <p className="text-gray-700 text-sm mb-2 font-bold line-through">
                      ₱{pkg.price}
                    </p>
                    <p className="text-gray-700 text-lg mb-2 font-bold text-red-600">
                      ₱{pkg.discountedPrice}
                    </p>
                    <button
                      className="w-3/4 py-2 mx-auto rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-yellow-600 to-red-600 text-white hover:from-yellow-700 hover:to-red-700 shadow-sm hover:shadow-md block"
                      onClick={() => openConfirmCoins(pkg)}
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={confirmOpen}
          title="Confirm Purchase"
          onConfirm={handleConfirmPurchase}
          onCancel={() => setConfirmOpen(false)}
          confirmLabel="Confirm Purchase"
        >
          {confirmData?.type === 'ability' && (
            <div>
              Buy <span className="font-semibold">{confirmData.item.name}</span> for{' '}
              <span className="font-semibold">{confirmData.item.cost}</span> coins?
            </div>
          )}
          {confirmData?.type === 'coins' && (
            <div>
              Buy <span className="font-semibold">{confirmData.item.coins}</span> coins for{' '}
              <span className="font-semibold">₱{confirmData.item.discountedPrice}</span>?
            </div>
          )}
        </ConfirmDialog>

        <WarningDialog
          open={warningOpen}
          message={warningMessage}
          onClose={() => setWarningOpen(false)}
        />

        <SuccessDialog
          open={successOpen}
          message={successMessage}
          onClose={() => setSuccessOpen(false)}
        />

      </div>
    </div>
  );
};

export default Shop;