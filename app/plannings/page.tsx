'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CityModal from '@/components/modals/CityModal';
import PlanningNameModal from '@/components/modals/PlanningNameModal';
import PostalCodeModal from '@/components/modals/PostalCodeModal';
import { LogOut, Trash2 } from 'lucide-react';
import { 
  City, 
  GeminiSuggestion, 
  User, 
  Planning as PlanningType, 
  Slot as SlotType 
} from '@/types';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
];

interface LocalSlot {
  day: string;
  hour: string;
  city?: City;
}

interface LocalPlanning {
  id: string;
  name: string;
  country: string;
  hours: string[];
  slots: Record<string, LocalSlot>;
}

interface CitySearchResult {
  postalCode: string;
  name: string;
  details?: string;
  distance?: number;
  latitude: number;
  longitude: number;
}

export default function Planning() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [plannings, setPlannings] = useState<LocalPlanning[]>([]);

  /* --- État des Modales --- */
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [currentSlot, setCurrentSlot] = useState<{ 
    planningId: string;
    day: string; 
    hour: string;
  } | null>(null);

  const [showPlanningNameModal, setShowPlanningNameModal] = useState(false);
  const [showPostalCodeModal, setShowPostalCodeModal] = useState(false);

  /* --- État de la Logique --- */
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);

  /* --- État des Données --- */
  const [citySearch, setCitySearch] = useState('');
  const [quickPlanningName, setQuickPlanningName] = useState('');
  const [tempPlanningName, setTempPlanningName] = useState('');
  const [tempSelectedHours, setTempSelectedHours] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('FR');
  const [postalCode, setPostalCode] = useState('');

  // ✅ NOUVEAU : villes issues de la recherche Gemini
  const [searchedCities, setSearchedCities] = useState<City[]>([]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/auth/login');
        return;
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const loadPlannings = async () => {
    try {
      const response = await fetch('/api/plannings');
      if (response.ok) {
        const data = await response.json();
        
        const transformedPlannings: LocalPlanning[] = data.plannings.map((p: PlanningType) => {
          const slotsMap: Record<string, LocalSlot> = {};
          
          if (p.slots) {
            p.slots.forEach((slot: SlotType) => {
              const key = `${slot.day}-${slot.hour}`;
              slotsMap[key] = {
                day: slot.day,
                hour: slot.hour,
                city: {
                  id: slot.id,
                  name: slot.city,
                  postalCode: slot.postalCode,
                  latitude: slot.latitude,
                  longitude: slot.longitude,
                },
              };
            });
          }

          return {
            id: p.id,
            name: p.name,
            country: p.country,
            hours: p.hours,
            slots: slotsMap,
          };
        });
        
        setPlannings(transformedPlannings);
      }
    } catch (error) {
      console.error('Error loading plannings:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await loadPlannings();
    };
    init();
  }, []);

  const handleCreatePlanning = () => {
    setTempPlanningName(quickPlanningName || '');
    setTempSelectedHours(['10h', '13h', '16h', '19h']);
    setShowPlanningNameModal(true);
  };

  const handleConfirmNewPlanning = async () => {
    if (!tempPlanningName.trim()) {
      alert('Veuillez donner un nom au planning');
      return;
    }
    if (tempSelectedHours.length === 0) {
      alert('Veuillez sélectionner au moins un horaire');
      return;
    }
    try {
      const response = await fetch('/api/plannings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempPlanningName,
          hours: tempSelectedHours,
          country: selectedCountry,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newPlanning: LocalPlanning = {
          id: data.planning.id,
          name: tempPlanningName,
          country: selectedCountry,
          hours: tempSelectedHours,
          slots: {},
        };
        setPlannings(prev => [...prev, newPlanning]);
        setShowPlanningNameModal(false);
        setQuickPlanningName('');
      }
    } catch (error) {
      console.error('Error creating planning:', error);
      alert('Erreur lors de la création du planning');
    }
  };

  const handleDeletePlanning = async (planningId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) return;
    try {
      const response = await fetch(`/api/plannings/${planningId}`, { method: 'DELETE' });
      if (response.ok) {
        setPlannings(prev => prev.filter(p => p.id !== planningId));
      }
    } catch (error) {
      console.error('Error deleting planning:', error);
    }
  };

  // ✅ MODIFIÉ : Utilise maintenant la recherche géographique réelle
const handleCellClick = async (planningId: string, day: string, hour: string) => {
    const inputPostalCode = window.prompt(`Code postal pour ${day} à ${hour} :`);
    if (!inputPostalCode || !inputPostalCode.trim()) return;

    setCurrentSlot({ planningId, day, hour });
    setSearchedCities([]); 
    setShowCityModal(true); 

    try {
        // Appelle la route de recherche géographique (sans IA)
        const response = await fetch('/api/cities/search-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                postalCode: inputPostalCode.trim(),
                countryCode: selectedCountry,
            }),
        });

        if (!response.ok) throw new Error('Erreur recherche');
        const data = await response.json();

        const cities: City[] = data.cities.map((c: CitySearchResult) => ({
            id: `${c.postalCode}-${c.name}`.toLowerCase().replace(/\s+/g, '-'),
            name: c.name,
            postalCode: c.postalCode,
            details: c.details || `Ville en ${selectedCountry}`,
            distance: c.distance,
            latitude: c.latitude,
            longitude: c.longitude,
        }));

        setSearchedCities(cities);
    } catch (error) {
        console.error('Erreur recherche villes:', error);
        alert('Code postal introuvable ou erreur réseau');
        setShowCityModal(false);
    }
};

  const handleCitySelect = async (city: City) => {
    if (!currentSlot) return;
    const { planningId, day, hour } = currentSlot;
    try {
      await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningId,
          city: city.name,
          postalCode: city.postalCode,
          latitude: city.latitude,
          longitude: city.longitude,
          day,
          hour,
          date: new Date(),
        }),
      });
      setPlannings(prev => prev.map(planning => {
        if (planning.id === planningId) {
          const key = `${day}-${hour}`;
          return {
            ...planning,
            slots: {
              ...planning.slots,
              [key]: { day, hour, city },
            },
          };
        }
        return planning;
      }));
      setShowCityModal(false);
      setCurrentSlot(null);
      setSearchedCities([]);
    } catch (error) {
      console.error('Error creating slot:', error);
    }
  };

  const handleHourChange = (hour: string) => {
    setTempSelectedHours(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]
    );
  };

 const confirmPostalCode = async () => {
  if (!postalCode.trim()) {
    alert('Veuillez entrer un code postal');
    return;
  }

  if (plannings.length === 0) {
    alert('Créez d\'abord un planning pour recevoir des suggestions');
    return;
  }

  const targetPlanningId = plannings[0].id;

  setShowPostalCodeModal(false);
  setIsCalculating(true);

  try {
    // ✅ Appeler la nouvelle route sans Gemini
    const response = await fetch('/api/suggestions-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        postalCode, 
        countryCode: selectedCountry,
        planningId: targetPlanningId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
    } else {
      alert('Erreur lors de la génération des suggestions');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Erreur lors de la génération des suggestions');
  } finally {
    setIsCalculating(false);
  }
};

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const handleAddSuggestion = async (suggestion: GeminiSuggestion) => {
    if (plannings.length === 0) {
      alert('Créez d\'abord un planning');
      return;
    }
    const targetPlanning = plannings[0];
    try {
      await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningId: targetPlanning.id,
          city: suggestion.city,
          postalCode: suggestion.postalCode,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          day: suggestion.day,
          hour: suggestion.hour,
          date: new Date(),
        }),
      });
      setPlannings(prev => prev.map(planning => {
        if (planning.id === targetPlanning.id) {
          const key = `${suggestion.day}-${suggestion.hour}`;
          return {
            ...planning,
            slots: {
              ...planning.slots,
              [key]: {
                day: suggestion.day,
                hour: suggestion.hour,
                city: {
                  id: suggestion.id,
                  name: suggestion.city,
                  postalCode: suggestion.postalCode,
                  latitude: suggestion.latitude,
                  longitude: suggestion.longitude,
                },
              },
            },
          };
        }
        return planning;
      }));
      alert('Créneau ajouté avec succès !');
    } catch (error) {
      console.error('Error adding suggestion:', error);
      alert('Erreur lors de l\'ajout du créneau');
    }
  };

  // ✅ Filtre sur les villes recherchées (plus de MOCK_CITIES)
  const filteredCities = searchedCities.filter(city =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className=" p-5 bg-slate-50 min-h-screen font-['Poppins']">
      <div className="bg-white rounded-xl shadow-lg p-8 animate-in fade-in duration-500">
        
        <h1 className="text-gray-800 text-center mb-8 text-4xl font-bold tracking-tight">
          Gestion des Plannings
        </h1>

        {isCalculating && (
          <div className="bg-orange-500 text-white p-4 rounded-lg text-center mb-6 animate-pulse font-medium shadow-sm">
            Calcul d&apos;optimisation des distances en cours...
          </div>
        )}

        {showSuggestions && (
          <div className="mt-8 mb-10">
            <h3 className="text-gray-800 mb-6 text-2xl font-bold flex items-center gap-2">
              Meilleures suggestions
            </h3>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="min-w-75 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col gap-4"
                >
                  <div>
                    <h4 className="text-gray-400 font-medium text-sm mb-1">{s.title}</h4>
                    <p className="text-gray-800 font-bold text-xl">{s.day} à {s.hour}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 italic text-sm">Point le plus proche :</p>
                    <p className="text-gray-600 font-semibold">{s.postalCode} - {s.city}</p>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>{s.distance} km</span>
                    <span>{s.duration}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{s.compatibility}% compatible</span>
                    <span className="text-gray-400 text-sm">{s.diffDistance} km</span>
                  </div>
                  {s.reasoning && (
                    <p className="text-xs text-gray-500 italic">{s.reasoning}</p>
                  )}
                  <button 
                    onClick={() => handleAddSuggestion(s)}
                    className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-md"
                  >
                    Ajouter ce créneau
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8 flex-wrap items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100">
          <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 bg-white min-w-45 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={quickPlanningName}
            onChange={(e) => setQuickPlanningName(e.target.value)}
            placeholder="Nom du planning"
            className="px-4 py-3 rounded-lg border border-gray-300 bg-white min-w-55 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />

          <button
            onClick={handleCreatePlanning}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all shadow-md active:scale-95"
          >
            + Nouveau Planning
          </button>

          <button
            onClick={() => setShowPostalCodeModal(true)}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all shadow-md active:scale-95"
          >
            Suggérer un Créneau
          </button>

          <button
            onClick={handleLogout}
            className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut color="blue" size={24} />
          </button>
        </div>

        {plannings.map((planning) => (
          <div key={planning.id} className="mb-10">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="bg-blue-600 h-16 text-xl text-white flex justify-between items-center px-6 font-bold tracking-wide uppercase">
                <button
                  onClick={() => handleDeletePlanning(planning.id)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Supprimer ce planning"
                >
                  <Trash2 size={20} />
                </button>
                <span className="flex-1 text-center">
                  {planning.name} - {COUNTRIES.find(c => c.code === planning.country)?.name}
                </span>
                <div className="w-10"></div>
              </div>

              <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200 text-gray-700 font-bold text-center">
                <div className="py-4 border-r border-gray-200 text-xs uppercase text-gray-400 flex items-center justify-center">
                  Horaires
                </div>
                {DAYS.map((day) => (
                  <div key={day} className="py-4 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {planning.hours.map(hour => (
                <div key={hour} className="grid grid-cols-6 border-b border-gray-100 last:border-0 group">
                  <div className="p-6 bg-gray-50/50 text-gray-800 text-center font-black flex items-center justify-center border-r border-gray-100">
                    {hour}
                  </div>
                  {DAYS.map(day => {
                    const slotKey = `${day}-${hour}`;
                    const slot = planning.slots[slotKey];
                    return (
                      <div
                        key={slotKey}
                        onClick={() => handleCellClick(planning.id, day, hour)}
                        className={`p-4 border-l border-gray-100 min-h-25 cursor-pointer transition-all flex flex-col items-center justify-center relative ${
                          slot?.city 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-blue-50 text-gray-300 hover:text-blue-500'
                        }`}
                      >
                        {slot?.city ? (
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-900">{slot.city.name}</p>
                            <p className="text-xs text-gray-600">{slot.city.postalCode}</p>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl font-light transform transition-transform hover:scale-150">+</span>
                            <span className="text-[9px] font-bold uppercase mt-1 opacity-0 hover:opacity-100 transition-opacity">Ajouter</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}

        {plannings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-4">Aucun planning créé</p>
            <p className="text-sm">Cliquez sur &quot;Nouveau Planning&quot; pour commencer</p>
          </div>
        )}
      </div>

      {/* ✅ CityModal inchangée - reçoit maintenant les villes de Gemini */}
      <CityModal
        isOpen={showCityModal}
        onClose={() => {
          setShowCityModal(false);
          setCurrentSlot(null);
          setSearchedCities([]);
        }}
        cities={filteredCities}
        citySearch={citySearch}
        setCitySearch={setCitySearch}
        selectedCity={selectedCity?.id || ""}
        setSelectedCity={(cityId: string) => {
          const city = searchedCities.find(c => c.id === cityId);
          if (city) setSelectedCity(city);
        }}
        onSelectCity={handleCitySelect}
      />

      <PlanningNameModal
        isOpen={showPlanningNameModal}
        onClose={() => setShowPlanningNameModal(false)}
        planningName={tempPlanningName}
        setPlanningName={setTempPlanningName}
        selectedHours={tempSelectedHours}
        handleHourChange={handleHourChange}
        onConfirm={handleConfirmNewPlanning}
      />

      <PostalCodeModal
        isOpen={showPostalCodeModal}
        onClose={() => setShowPostalCodeModal(false)}
        postalCode={postalCode}
        setPostalCode={setPostalCode}
        onConfirm={confirmPostalCode}
        countryCode={selectedCountry}
      />
    </div>
  );
}