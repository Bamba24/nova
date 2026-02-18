'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  MapPin,
  LogOut,
  UserPlus,
  User,
  Activity,
  Plus,
} from 'lucide-react';
import CreateUserModal from '@/components/admin/CreateUserModal';
import StatsCard from '@/components/admin/StatsCard';
import UsersTable from '@/components/admin/UsersTable';
import LogsTable from '@/components/admin/LogsTable';


interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  _count?: {
    plannings: number;
  };
}

interface Stats {
  totalUsers: number;
  totalPlannings: number;
  totalSlots: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPlannings: 0,
    totalSlots: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/auth/login');
        return;
      }

      const data = await response.json();
      if (data.user.role !== 'ADMIN') {
        router.push('/plannings');
        return;
      }

      setCurrentUser(data.user);
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Erreur lors du changement de rôle');
      }
    } catch (error) {
      alert('Erreur lors du changement de rôle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Administrateur
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Bienvenue, {currentUser?.name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={()=> router.push('/plannings')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Créer un planning
              </button>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={20} />
                Créer un utilisateur
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Utilisateurs totaux"
            value={stats.totalUsers}
            icon={<Users className="text-blue-600" size={24} />}
            bgColor="bg-blue-50"
          />
          <StatsCard
            title="Plannings créés"
            value={stats.totalPlannings}
            icon={<Calendar className="text-green-600" size={24} />}
            bgColor="bg-green-50"
          />
          <StatsCard
            title="Créneaux planifiés"
            value={stats.totalSlots}
            icon={<MapPin className="text-purple-600" size={24} />}
            bgColor="bg-purple-50"
          />
          <StatsCard
            title="Utilisateurs actifs"
            value={stats.activeUsers}
            icon={<Activity className="text-orange-600" size={24} />}
            bgColor="bg-orange-50"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={18} className="inline mr-2" />
                Gestion des utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity size={18} className="inline mr-2" />
                Logs d&apos;activité
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' ? (
              <UsersTable
                users={users}
                onDeleteUser={handleDeleteUser}
                onChangeRole={handleChangeRole}
                currentUserId={currentUser?.id}
              />
            ) : (
              <LogsTable />
            )}
          </div>
        </div>
      </main>

      {/* Modal Create User */}
      {showCreateUser && (
        <CreateUserModal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}