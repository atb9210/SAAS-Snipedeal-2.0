// src/app/admin/plans/page.tsx - Gestione Piani Admin
// Timestamp: 2024-12-09

import prisma from '@/lib/prisma';

async function getPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceYear: 'asc' },
    include: {
      _count: {
        select: { users: true }
      }
    }
  });
  return plans;
}

export default async function AdminPlansPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione Piani</h1>
        <p className="text-gray-500">{plans.length} piani configurati</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
              plan.name === 'Ultra' ? 'border-primary' : 'border-transparent'
            }`}
          >
            {/* Plan Badge */}
            {plan.name === 'Ultra' && (
              <div className="mb-4">
                <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                  Popolare
                </span>
              </div>
            )}

            {/* Plan Name & Price */}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">
                €{plan.priceYear}
              </span>
              {plan.priceYear > 0 && (
                <span className="text-gray-500">/anno</span>
              )}
            </div>

            {/* Stats */}
            <div className="py-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Utenti attivi</span>
                <span className="font-semibold text-gray-900">
                  {plan._count.users}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 py-4 border-t border-gray-100">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>{plan.maxCampaigns} campagne</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>{plan.maxMarketplaces} marketplace</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>
                  Ogni {plan.frequencyMins >= 60 
                    ? `${plan.frequencyMins / 60} ore` 
                    : `${plan.frequencyMins} min`}
                </span>
              </li>
            </ul>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          💡 Per modificare i piani, aggiorna i valori nel file <code className="bg-blue-100 px-1 rounded">prisma/seed.ts</code> e riesegui il seed.
        </p>
      </div>
    </div>
  );
}

