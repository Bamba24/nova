'use client';

import { useState } from 'react';

interface PostalCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  onConfirm: () => void;
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

  const handleConfirm = async () => {
    if (!selectedPlanningId && setSelectedPlanningId) {
      alert('Veuillez sélectionner un planning');
      return;
    }
    
    setIsSearching(true);
    await onConfirm();
    setIsSearching(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/10 backdrop-blur-sm bg-opacity-50">
      <div className="bg-white my-[5%] mx-auto p-6 rounded-xl w-[90%] max-w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl text-gray-800 m-0">Suggérer un créneau</h3>
          <span 
            className="text-2xl font-bold cursor-pointer text-gray-600 hover:text-black"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        
        <div className="py-5">
          {/* ✅ Select planning */}
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
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleConfirm()}
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
              onClick={handleConfirm}
              disabled={isSearching}
            >
              {isSearching && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}