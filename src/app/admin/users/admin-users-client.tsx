// src/app/admin/users/admin-users-client.tsx - Admin Users UI
// Timestamp: 2024-12-09

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MoreVertical, 
  Shield, 
  Crown,
  Trash2,
  User
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  planId: string | null;
  planName: string | null;
  campaignsCount: number;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

interface AdminUsersClientProps {
  users: UserData[];
  plans: Plan[];
}

export function AdminUsersClient({ users: initialUsers, plans }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<Record<string, { top: number; right: number; position: 'bottom' | 'top' }>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'admin' && user.role === 'ADMIN') ||
      (filter === 'user' && user.role === 'USER');

    return matchesSearch && matchesFilter;
  });

  const handleMenuToggle = (userId: string) => {
    if (menuOpen === userId) {
      setMenuOpen(null);
      return;
    }

    setMenuOpen(userId);
    
    // Calcola la posizione del dropdown dopo che il DOM è aggiornato
    setTimeout(() => {
      const button = buttonRefs.current[userId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 200; // Altezza approssimativa del dropdown
        
        // Calcola la posizione right (distanza dal bordo destro dello schermo)
        const right = window.innerWidth - rect.right;
        
        // Se non c'è spazio sotto ma c'è spazio sopra, posiziona verso l'alto
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setMenuPosition(prev => ({ 
            ...prev, 
            [userId]: { 
              top: rect.top - dropdownHeight - 4, 
              right,
              position: 'top' 
            } 
          }));
        } else {
          setMenuPosition(prev => ({ 
            ...prev, 
            [userId]: { 
              top: rect.bottom + 4, 
              right,
              position: 'bottom' 
            } 
          }));
        }
      }
    }, 0);
  };

  const handleUpdatePlan = async (userId: string, planId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      if (res.ok) {
        const plan = plans.find(p => p.id === planId);
        setUsers(users.map(u => 
          u.id === userId ? { ...u, planId, planName: plan?.name || null } : u
        ));
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
    setMenuOpen(null);
  };

  // Aggiorna la posizione del dropdown durante lo scroll
  useEffect(() => {
    if (!menuOpen) return;

    const updatePosition = () => {
      const userId = menuOpen;
      const button = buttonRefs.current[userId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 200;
        const right = window.innerWidth - rect.right;
        
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setMenuPosition(prev => ({ 
            ...prev, 
            [userId]: { 
              top: rect.top - dropdownHeight - 4, 
              right,
              position: 'top' 
            } 
          }));
        } else {
          setMenuPosition(prev => ({ 
            ...prev, 
            [userId]: { 
              top: rect.bottom + 4, 
              right,
              position: 'bottom' 
            } 
          }));
        }
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [menuOpen]);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
        <p className="text-gray-500">{users.length} utenti registrati</p>
      </header>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca utenti..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'user', 'admin'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tutti' : f === 'admin' ? 'Admin' : 'Utenti'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Utente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Piano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Campagne
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Registrato
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {user.name || 'Senza nome'}
                          </span>
                          {user.role === 'ADMIN' && (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.planName === 'Free' 
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-primary-100 text-primary-700'
                    }`}>
                      <Crown className="w-3 h-3 mr-1" />
                      {user.planName || 'Nessuno'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {user.campaignsCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatRelativeDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        ref={(el) => { buttonRefs.current[user.id] = el; }}
                        onClick={() => handleMenuToggle(user.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {menuOpen === user.id && menuPosition[user.id] && (
                        <div 
                          className="fixed bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 min-w-[180px]"
                          style={{
                            top: `${menuPosition[user.id].top}px`,
                            right: `${menuPosition[user.id].right}px`
                          }}
                        >
                          <p className="px-4 py-1 text-xs text-gray-500 uppercase">
                            Cambia Piano
                          </p>
                          {plans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => handleUpdatePlan(user.id, plan.id)}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                user.planId === plan.id ? 'text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              {plan.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun utente trovato</p>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMenuOpen(null)} 
        />
      )}
    </div>
  );
}


