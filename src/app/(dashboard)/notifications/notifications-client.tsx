// src/app/(dashboard)/notifications/notifications-client.tsx - UI Notifiche
// Timestamp: 2024-12-09

'use client';

import { motion } from 'framer-motion';
import { Bell, ExternalLink, MapPin, Settings } from 'lucide-react';
import Link from 'next/link';
import { platformConfig, formatPrice, formatRelativeDate } from '@/lib/utils';
import FavoriteButton from '@/components/favorite-button';

interface Result {
  id: string;
  title: string;
  price: string | null;
  location: string | null;
  link: string;
  image: string | null;
  isNew: boolean;
  createdAt: string;
  campaign: { name: string; platform: string };
  isFavorited?: boolean; // Add favorite status
}

interface NotificationsClientProps {
  groupedResults: Record<string, Result[]>;
}

export function NotificationsClient({ groupedResults }: NotificationsClientProps) {
  const dates = Object.keys(groupedResults);
  const totalResults = Object.values(groupedResults).flat().length;

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifiche</h1>
            <p className="text-sm text-gray-500">
              {totalResults} risultati negli ultimi 7 giorni
            </p>
          </div>
          <Link 
            href="/profile/notifications"
            className="p-2 rounded-full bg-white shadow-sm"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </header>

      {/* Content */}
      {dates.length === 0 ? (
        <div className="empty-state py-16">
          <Bell className="empty-state-icon" />
          <p className="empty-state-title">Nessuna notifica</p>
          <p className="empty-state-description">
            Le notifiche sui nuovi annunci appariranno qui
          </p>
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {dates.map((date, dateIndex) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIndex * 0.1 }}
            >
              {/* Date Header */}
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                {date}
              </h2>

              {/* Results for this date */}
              <div className="space-y-3">
                {groupedResults[date].map((result, index) => {
                  const platform = platformConfig[result.campaign.platform as keyof typeof platformConfig];
                  
                  return (
                    <motion.a
                      key={result.id}
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="card flex gap-3 hover:shadow-card-hover"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                            {result.title}
                          </h3>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <FavoriteButton
                              resultId={result.id}
                              isFavorited={result.isFavorited || false}
                              size="sm"
                              className="bg-white shadow-sm"
                            />
                            <ExternalLink className="w-4 h-4 text-gray-300" />
                          </div>
                        </div>
                        
                        <p className="text-primary font-bold mt-0.5">
                          {formatPrice(result.price)}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{platform?.icon} {result.campaign.name}</span>
                          <span>•</span>
                          <span>{formatRelativeDate(result.createdAt)}</span>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}


