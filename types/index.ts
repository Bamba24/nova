// ============================================
// ENUMS
// ============================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum SlotStatus {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AdminAction {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PLANNING_DELETE = 'PLANNING_DELETE',
  SLOT_MODIFY = 'SLOT_MODIFY',
}

// ============================================
// MODELS
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  emailVerified: boolean;
  image: string | null;
  plannings?: Planning[];
  aiSuggestions?: AISuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Planning {
  id: string;
  userId: string;
  name: string;
  country: string;
  hours: string[];
  user?: User;
  slots?: Slot[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    slots: number;
  };
}

export interface Slot {
  id: string;
  planningId: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  day: string;
  date: Date;
  hour: string;
  status: SlotStatus;
  notes: string | null;
  planning?: Planning;
  createdAt: Date;
  updatedAt: Date;
}

export interface AISuggestion {
  id: string;
  userId: string;
  planningId: string | null;
  postalCode: string;
  countryCode: string;
  suggestionsJson: string;
  reasoning: string | null;
  accepted: boolean;
  acceptedSlotId: string | null;
  user?: User;
  createdAt: Date;
}

export interface AdminLog {
  id: string;
  adminUserId: string;
  action: AdminAction;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

// ============================================
// TYPES MÉTIER (pour l'application)
// ============================================

export interface City {
  id: string;
  name: string;
  postalCode: string;
  details?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export interface Country {
  code: string;
  name: string;
  prefix?: string;
}

export interface GeminiSuggestion {
  id: string;
  title: string;
  day: string;
  hour: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  distance: number;
  duration: string;
  compatibility: number;
  diffDistance: number;
  reasoning?: string;
}

export interface TimeSlot {
  hour: string;
  day: string;
  postalCode?: string;
  city?: string;
  isAvailable: boolean;
}

// ============================================
// PROPS DES MODALES
// ============================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CityModalProps extends ModalProps {
  citySearch: string;
  setCitySearch: (value: string) => void;
  cities: City[];
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  onSelectCity?: (city: City) => void;
}

export interface PlanningNameModalProps extends ModalProps {
  planningName: string;
  setPlanningName: (value: string) => void;
  selectedHours: string[];
  handleHourChange: (hour: string) => void;
  onConfirm: () => void;
}

export interface PostalCodeModalProps extends ModalProps {
  postalCode: string;
  setPostalCode: (value: string) => void;
  onConfirm: () => void;
  countryCode?: string;
}