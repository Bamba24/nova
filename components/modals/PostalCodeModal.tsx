'use client';

import { useState } from 'react';

interface City {
  name: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface PostalCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  onConfirm: (selectedCity?: City) => void;
  countryCode?: string;
  plannings?: Array<{ id: string; name: string }>;
  selectedPlanningId?: string;
  setSelectedPlanningId?: (id: string) => void;
}

export default function PostalCodeModal({ 
  isOpen, 
  onClose, 
  postalCode, 
  setPostalCode, 
  onConfirm,
  countryCode = '',
  plannings = [],
  selectedPlanningId = '',
  setSelectedPlanningId,
}: PostalCodeModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCitySelection, setShowCitySelection] = useState(false);

  const handleSearch = async () => {
    if (!selectedPlanningId && setSelectedPlanningId) {
      alert('Veuillez sélectionner un planning');
      return;
    }

    if (!postalCode.trim()) {
      alert('Veuillez entrer un code postal');
      return;
    }
    
    setIsSearching(true);
    setShowCitySelection(false);
    setCities([]);

    try {
      // Faire un appel préliminaire pour vérifier s'il y a plusieurs villes
      const response = await fetch('/api/suggestions-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: postalCode.trim(),
          countryCode,
          planningId: selectedPlanningId,
        }),
      });

      const data = await response.json();

      // Si plusieurs villes, afficher la sélection
      if (data.requiresCitySelection) {
        setCities(data.cities);
        setShowCitySelection(true);
        setIsSearching(false);
        return;
      }

      // Sinon, continuer avec les suggestions
      await onConfirm();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCityConfirm = async () => {
    if (!selectedCity) {
      alert('Veuillez sélectionner une ville');
      return;
    }

    setIsSearching(true);
    await onConfirm(selectedCity);
    setIsSearching(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white my-[5%] mx-auto p-6 rounded-xl w-[90%] max-w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl text-gray-800 m-0">
            {showCitySelection ? 'Sélectionnez une ville' : 'Suggérer un créneau'}
          </h3>
          <span 
            className="text-2xl font-bold cursor-pointer text-gray-600 hover:text-black"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        
        <div className="py-5">
          {!showCitySelection ? (
            <>
              {/* Select planning */}
              {plannings.length > 0 && setSelectedPlanningId && (
                <div className="mb-5">
                  <label htmlFor="planningSelect" className="block mb-2 text-gray-700 font-medium">
                    Planning cible :
                  </label>
                  <select
                    id="planningSelect"
                    value={selectedPlanningId}
                    onChange={(e) => setSelectedPlanningId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    disabled={isSearching}
                  >
                    <option value="">-- Sélectionnez un planning --</option>
                    {plannings.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Code postal */}
              <div className="mb-5">
                <label htmlFor="postalCode" className="block mb-2 text-gray-700 font-medium">
                  Code postal :
                </label>
                <div className="relative flex items-center gap-2.5">
                  <input 
                    type="text" 
                    id="postalCode" 
                    className="w-full p-2.5 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    placeholder="Entrez le code postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                    disabled={isSearching}
                  />
                  <span className="px-2.5 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm">
                    {countryCode}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 mt-5">
                <button 
                  className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  onClick={onClose}
                  disabled={isSearching}
                >
                  Annuler
                </button>
                <button 
                  className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSearching ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Liste des villes */}
              <p className="text-sm text-gray-600 mb-4">
                Plusieurs villes correspondent au code postal <strong>{postalCode}</strong>. 
                Veuillez sélectionner la ville souhaitée :
              </p>
              
              <div className="space-y-2 mb-5 max-h-[400px] overflow-y-auto">
                {cities.map((city, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedCity(city)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCity?.name === city.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{city.name}</div>
                    <div className="text-sm text-gray-500">
                      {city.postalCode} • {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2.5">
                <button 
                  className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={() => {
                    setShowCitySelection(false);
                    setSelectedCity(null);
                  }}
                >
                  Retour
                </button>
                <button 
                  className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  onClick={handleCityConfirm}
                  disabled={!selectedCity || isSearching}
                >
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSearching ? 'Calcul...' : 'Confirmer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}