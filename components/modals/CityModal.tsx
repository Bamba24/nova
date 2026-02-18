'use client';

import { CityModalProps, City } from '@/types';

export default function CityModal({ 
  isOpen, 
  onClose, 
  citySearch, 
  selectedCity,
  setSelectedCity,
  setCitySearch, 
  cities,
  onSelectCity,
}: CityModalProps) {
  if (!isOpen) return null;

  // ✅ Si aucune ville et recherche vide = état de chargement
  const isLoading = cities.length === 0 && !citySearch;

  return (
    <div className="fixed inset-0 z-1000 flex items-start justify-center bg-black/10 backdrop-blur-sm bg-opacity-50">
      <div className="bg-white my-[5%] mx-auto p-6 rounded-xl w-[90%] max-w-200 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl text-gray-800 m-0">Sélectionnez une ville</h3>
          <span 
            className="text-2xl font-bold cursor-pointer text-gray-600 hover:text-black"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        
        <input 
          type="text" 
          className="w-full p-2.5 mb-4 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
          placeholder="Rechercher une ville..." 
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
        />
        
        {/* ✅ État de chargement */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Recherche en cours...</p>
            <p className="text-sm mt-1">Recherche des villes proches</p>
          </div>
        )}

        {/* ✅ Liste des villes (si pas en chargement) */}
        {!isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 py-5 m-0 list-none" id="cityList">
            {cities.map((city: City) => (
              <div
                key={city.id}
                className="bg-gray-50 p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-2"
                onClick={() => onSelectCity?.(city)}
              >
                <div className="text-lg font-medium text-gray-800">{city.name}</div>
                
                {city.latitude && city.longitude && (
                  <div className="flex flex-col mt-1 text-xl text-gray-500">
                    {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
            {cities.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                Aucune ville trouvée
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}