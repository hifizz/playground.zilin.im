export type ChartSpec =
  | DonutSpec | StackedBarHSpec | HorizontalBarSpec
  | BarLineComboSpec | DualAxisBarLineSpec | ProbabilityRangeSpec;

export interface DonutSpec {
  type: 'donut';
  title: string;
  center_label?: string;   // 中心大字标签,如 "海外占比"
  center_value?: string;   // 中心数值,如 "43.8%"
  data: Array<{ name: string; pct: number; value_yi?: number }>;
  annotation?: string;
}

export interface StackedBarHSpec {
  type: 'stacked_bar_h';
  title: string;
  data: Array<{ name: string; pct?: number; value_yi?: number; yoy?: string }>;
}

export interface HorizontalBarSpec {
  type: 'horizontal_bar';
  title: string;
  data: Array<{ name: string; pe?: number; gross_margin?: number; highlight?: boolean }>;
}

export interface BarLineComboSpec {
  type: 'bar_line_combo';
  title: string;
  data: {
    periods: string[];
    bar: { name: string; values: number[] };
    line: { name: string; values: number[] };
  };
}

export interface DualAxisBarLineSpec {
  type: 'dual_axis_bar_line';
  title: string;
  data: {
    periods: string[];
    bars: Array<{ name: string; values: number[] }>;
    lines: Array<{ name: string; values: number[]; axis?: 'right_pct' }>;
  };
}

export interface ProbabilityRangeSpec {
  type: 'probability_range';
  title: string;
  data: {
    current_price: number;
    expected_value: number;
    expected_upside_pct: number;
    scenarios: Array<{
      name: string; low: number; high: number;
      anchor: number; anchor_change_pct: number; probability: number;
    }>;
  };
}
