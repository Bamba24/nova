'use client';

import { useState, useEffect } from 'react';

interface AdminLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function LogsTable() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_CREATE':
      case 'PLANNING_CREATE':
      case 'SLOT_CREATE':
        return 'bg-green-100 text-green-800';

      case 'USER_DELETE':
      case 'PLANNING_DELETE':
      case 'SLOT_DELETE':
        return 'bg-red-100 text-red-800';

      case 'USER_UPDATE':
        return 'bg-blue-100 text-blue-800';

      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      USER_CREATE: 'Création utilisateur',
      USER_DELETE: 'Suppression utilisateur',
      // USER_UPDATE: 'Modification utilisateur',
      // ROLE_CHANGE: 'Changement de rôle',
      PLANNING_CREATE: 'Création planning',
      PLANNING_DELETE: 'Suppression planning',
      SLOT_CREATE: 'Ajout créneau',
      SLOT_DELETE: 'Suppression créneau',
    };

    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {logs.length} action{logs.length > 1 ? 's' : ''} enregistrée{logs.length > 1 ? 's' : ''}
        </p>
        <span className="text-xs text-gray-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Mise à jour auto
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Détails
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              let details = null;

              try {
                details = log.details ? JSON.parse(log.details) : null;
              } catch {
                details = null;
              }

              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  {/* Utilisateur */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Utilisateur supprimé
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>

                  {/* Détails */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {details ? (
                      <div>
                        {/* USER DELETE */}
                        {log.action === 'USER_DELETE' && (
                          <div>
                            <strong>{details.name}</strong>
                            <div className="text-xs text-gray-400">
                              {details.email}
                            </div>
                          </div>
                        )}


                        {/* USER CREATE */}
                        {log.action === 'USER_CREATE' && (
                          <div>
                            <strong>{details.name ?? 'Nouvel utilisateur'}</strong>
                            {details.email && (
                              <div className="text-xs text-gray-400">
                                {details.email}
                              </div>
                            )}
                            {details.message && (
                              <div className="text-xs text-gray-400">
                                {details.message}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ROLE CHANGE
                        {log.action === 'ROLE_CHANGE' && (
                          <div>
                            <strong>{details.name}</strong>
                            <div className="text-xs text-gray-400">
                              {details.oldRole} → {details.newRole}
                            </div>
                          </div>
                        )} */}

                        {/* PLANNING */}
                        {(log.action === 'PLANNING_DELETE' ||
                          log.action === 'PLANNING_CREATE') && (
                          <span>
                            Planning : <strong>{details.name}</strong>
                          </span>
                        )}

                        {/* SLOT */}
                        {(log.action === 'SLOT_CREATE' ||
                          log.action === 'SLOT_DELETE') && (
                          <div className="space-y-1">
                            <div>
                              <strong>{details.city}</strong> (
                              {details.postalCode})
                            </div>
                            <div className="text-xs text-gray-400">
                              {details.day} à {details.hour} •{' '}
                              {details.planningName}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* IP */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress || '-'}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun log disponible
          </div>
        )}
      </div>
    </div>
  );
}