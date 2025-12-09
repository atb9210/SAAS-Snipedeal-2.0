// src/app/(dashboard)/pricing/pricing-client.tsx - UI Piani e Prezzi
// Timestamp: 2024-12-09

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, Zap } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  maxCampaigns: number;
  maxMarketplaces: number;
  frequencyMins: number;
  priceYear: number;
}

interface PricingClientProps {
  plans: Plan[];
  currentPlanId: string | null | undefined;
}

export function PricingClient({ plans, currentPlanId }: PricingClientProps) {
  const router = useRouter();

  const formatFrequency = (mins: number) => {
    if (mins < 60) return `${mins} minuti`;
    if (mins === 60) return '1 ora';
    return `${mins / 60} ore`;
  };

  const getPlanFeatures = (plan: Plan) => [
    `${plan.maxCampaigns} campagne`,
    `${plan.maxMarketplaces} marketplace`,
    `Aggiornamenti ogni ${formatFrequency(plan.frequencyMins)}`,
    'Notifiche push',
    ...(plan.priceYear > 0 ? ['Supporto prioritario'] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">Piani e Prezzi</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Scegli il Piano Giusto per Te
          </h2>
          <p className="text-gray-500">
            Inizia gratis, fai l'upgrade quando vuoi
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="space-y-4 mb-8">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === currentPlanId;
            const isPopular = plan.name === 'Pro';
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card relative overflow-hidden ${
                  isPopular ? 'border-2 border-primary' : ''
                } ${isCurrent ? 'bg-primary-50' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPOLARE
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-success text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                    ATTUALE
                  </div>
                )}

                <div className="pt-4">
                  {/* Plan Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`w-5 h-5 ${isPopular ? 'text-primary' : 'text-gray-400'}`} />
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.priceYear === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Gratis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          €{plan.priceYear}
                        </span>
                        <span className="text-gray-500">/anno</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {getPlanFeatures(plan).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${isPopular ? 'text-primary' : 'text-success'}`} />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <button className="w-full btn-ghost btn-md" disabled>
                      Piano Attuale
                    </button>
                  ) : plan.priceYear === 0 ? (
                    <button className="w-full btn-ghost btn-md" disabled>
                      Downgrade non disponibile
                    </button>
                  ) : (
                    <button className="w-full btn-primary btn-md">
                      Passa a {plan.name}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-gray-400">
          Il billing non è ancora attivo. Tutti i piani sono temporaneamente gratuiti.
        </p>
      </div>
    </div>
  );
}


