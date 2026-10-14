import React from 'react';
import LiveMeterCard from './LiveMeterCard';
import BillForecastCard from './BillForecastCard';
import BudgetPlannerCard from './BudgetPlannerCard';
import BillVerificationCard from './BillVerificationCard';

export default function CitizenOverview({
  telemetry,
  forecast,
  budgetStatus,
  onRefreshTelemetry,
  onBudgetUpdated,
  onTriggerDisputeModal,
  onOpenPowerQuality
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top 2 Cards: Live Smart Meter & AI Bill Forecast */}
      <div className="grid-overview">
        <LiveMeterCard 
          telemetry={telemetry} 
          onRefresh={onRefreshTelemetry} 
          onOpenPowerQuality={onOpenPowerQuality} 
        />
        <BillForecastCard forecast={forecast} />
      </div>

      {/* Bottom 2 Cards: Budget Planner & Bill Verification Tool */}
      <div className="grid-2">
        <BudgetPlannerCard
          budgetStatus={budgetStatus}
          onBudgetUpdated={onBudgetUpdated}
        />
        <BillVerificationCard
          onTriggerDisputeModal={onTriggerDisputeModal}
        />
      </div>
    </div>
  );
}
