export interface Meter {
    id: number;
    name: string;
    description?: string;
    location?: string;
    is_active: boolean;
}

export interface PowerReading {
    id: number;
    meter_name: string;
    timestamp: string;
    local_time?: string;
    voltage: number;
    current: number;
    active_power: number;
    apparent_power: number;
    reactive_power: number;
    power_factor: number;
    frequency: number;
}

export interface EnergyReading {
    id: number;
    meter_name: string;
    timestamp: string;
    import_active_energy: number;
    export_active_energy: number;
    import_reactive_energy: number;
    export_reactive_energy: number;
    power_demand: number;
    maximum_power_demand: number;
}

export interface RealtimeData {
    voltage: number;
    current: number;
    active_power: number;
    apparent_power: number;
    reactive_power: number;
    power_factor: number;
    frequency: number;
    local_time: string;
    import_active_energy?: number;
    export_active_energy?: number;
    power_demand?: number;
}

export interface TimeseriesPoint {
    timestamp: string;
    local_time?: string;
    voltage: number;
    current: number;
    active_power: number;
    power_factor: number;
    frequency?: number;
}

export interface MeterSummary {
    meter_name: string;
    last_reading?: string;
    voltage?: number;
    current?: number;
    active_power?: number;
    power_factor?: number;
    frequency?: number;
    import_active_energy?: number;
}

// Billing Calculator Types
export interface ToUBreakdown {
    peak_kwh: number;
    peak_rate_sen: number;
    peak_cost_rm: number;
    offpeak_kwh: number;
    offpeak_rate_sen: number;
    offpeak_cost_rm: number;
    total_energy_charge_rm: number;
}

export interface MonthlyBilling {
    month?: string; // Backward compatibility
    period?: string; // New: "2024-01~02" format (20 Jan - 19 Feb)
    start_month?: string; // New: "2024-01"
    end_month?: string; // New: "2024-02"
    year?: number; // Optional
    month_num?: number; // Optional
    consumption_kwh: number;

    // For GENERAL tariff
    energy_tier?: "tier1" | "tier2";
    energy_rate_sen?: number;
    energy_charge_rm?: number;

    // For TOU tariff
    tou_breakdown?: ToUBreakdown;
    // energy_tier also applies to TOU (tier1: ≤1500, tier2: >1500)

    // Common charges (both tariffs)
    capacity_charge_rm: number;
    network_charge_rm: number;
    afa_charge_rm: number;
    retail_charge_rm: number;

    // Efficiency incentive (if consumption <1000 kWh)
    efficiency_incentive_rm: number;
    efficiency_rate_sen?: number;  // Optional for backward compatibility

    subtotal_before_incentive_rm: number;
    kwtb_charge_rm: number;

    total_amount_rm: number;
}

export interface BillingSummary {
    total_consumption_kwh: number;
    total_cost_rm: number;
    avg_monthly_consumption_kwh: number;
    avg_monthly_cost_rm: number;
    months_analyzed?: number; // Backward compatibility
    periods_analyzed?: number; // New: billing periods (20/MM - 19/MM)
}

export interface BillingData {
    meter_name: string;
    tariff_type: "GENERAL" | "TOU";
    timezone: string;
    billing_period_format?: string; // "20/MM - 19/MM"
    billing_data: MonthlyBilling[];
    summary: BillingSummary;
}

export interface TariffRate {
    id: number;
    tariff_type: "GENERAL" | "TOU";
    is_active: boolean;
    effective_from: string;
    effective_to: string | null;

    // General tariff (2-tier)
    energy_rate_tier1_sen: number;
    energy_rate_tier2_sen: number;
    tier1_threshold_kwh: number;

    // ToU tariff (also 2-tier based on consumption)
    // Tier 1 (≤1500 kWh)
    energy_rate_tier1_peak_sen: number;
    energy_rate_tier1_offpeak_sen: number;
    // Tier 2 (>1500 kWh)
    energy_rate_tier2_peak_sen: number;
    energy_rate_tier2_offpeak_sen: number;

    // Common
    capacity_rate_sen: number;
    network_rate_sen: number;
    retail_charge_rm: number;
    retail_waive_threshold_kwh: number;
}

export interface FuelAdjustment {
    id: number;
    rate_sen_per_kwh: number;
    effective_month: string;
    is_active: boolean;
    description: string;
}

export interface EfficiencyIncentiveTier {
    id: number;
    min_kwh: number;
    max_kwh: number;
    rebate_sen_per_kwh: number;
    is_active: boolean;
}
