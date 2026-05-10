"use client";

import { useEffect, useRef, useState } from "react";
import { Liveline } from "liveline";
import type { LivelinePoint, LivelineSeries } from "liveline";

/* ─── Heart rate — calm sinusoidal drift, exaggerated Y, custom formatter. */

export function HeartRateDemo() {
  const [data, setData] = useState<LivelinePoint[]>([]);
  const [value, setValue] = useState(72);

  useEffect(() => {
    const tick = () => Date.now() / 1000;
    const sample = (t: number) =>
      72 + Math.sin(t / 3.5) * 4 + Math.sin(t / 1.1) * 1.4 + (Math.random() - 0.5) * 1.2;

    const now = tick();
    const seed: LivelinePoint[] = [];
    for (let i = 80; i >= 0; i--) {
      const t = now - i * 0.4;
      seed.push({ time: t, value: sample(t) });
    }
    setData(seed);
    setValue(seed[seed.length - 1].value);

    const id = window.setInterval(() => {
      const t = tick();
      const v = sample(t);
      setValue(v);
      setData((prev) => {
        const next = [...prev, { time: t, value: v }];
        return next.length > 240 ? next.slice(-240) : next;
      });
    }, 400);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="lv-chart-host">
      <Liveline
        data={data}
        value={value}
        color="#ff4d6d"
        theme="dark"
        exaggerate
        pulse
        formatValue={(v) => `${Math.round(v)} bpm`}
      />
    </div>
  );
}

/* ─── CPU usage — random walk with occasional spikes. Shows momentum & fill. */

export function CpuUsageDemo() {
  const [data, setData] = useState<LivelinePoint[]>([]);
  const [value, setValue] = useState(28);

  useEffect(() => {
    const tick = () => Date.now() / 1000;
    let v = 28;
    const step = () => {
      const drift = (Math.random() - 0.5) * 4;
      const spike = Math.random() < 0.06 ? Math.random() * 35 : 0;
      v = Math.max(2, Math.min(98, v + drift + spike - (v > 60 ? 4 : 0)));
      return v;
    };

    const now = tick();
    const seed: LivelinePoint[] = [];
    for (let i = 100; i >= 0; i--) {
      seed.push({ time: now - i * 0.3, value: step() });
    }
    setData(seed);
    setValue(v);

    const id = window.setInterval(() => {
      const t = tick();
      const next = step();
      setValue(next);
      setData((prev) => {
        const arr = [...prev, { time: t, value: next }];
        return arr.length > 300 ? arr.slice(-300) : arr;
      });
    }, 300);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="lv-chart-host">
      <Liveline
        data={data}
        value={value}
        color="#7c5cff"
        theme="light"
        formatValue={(v) => `${Math.round(v)}%`}
        referenceLine={{ value: 80, label: "throttle" }}
      />
    </div>
  );
}

/* ─── Multi-series prediction market — Yes / No / Other, sums to ~100. */

export function PredictionDemo() {
  const [series, setSeries] = useState<LivelineSeries[]>([]);

  useEffect(() => {
    const tick = () => Date.now() / 1000;
    let yes = 54;
    let no = 32;
    // other = 100 - yes - no (kept implicit by re-normalising)

    const step = () => {
      yes += (Math.random() - 0.5) * 2.5;
      no += (Math.random() - 0.5) * 2;
      yes = Math.max(8, Math.min(82, yes));
      no = Math.max(8, Math.min(82, no));
      // Keep yes + no ≤ 92 so other has air.
      const total = yes + no;
      if (total > 92) {
        const k = 92 / total;
        yes *= k;
        no *= k;
      }
      const other = Math.max(2, 100 - yes - no);
      return { yes, no, other };
    };

    const buildSeed = () => {
      const now = tick();
      const yArr: LivelinePoint[] = [];
      const nArr: LivelinePoint[] = [];
      const oArr: LivelinePoint[] = [];
      for (let i = 80; i >= 0; i--) {
        const t = now - i * 0.5;
        const { yes, no, other } = step();
        yArr.push({ time: t, value: yes });
        nArr.push({ time: t, value: no });
        oArr.push({ time: t, value: other });
      }
      return { yArr, nArr, oArr };
    };

    const { yArr, nArr, oArr } = buildSeed();
    const last = step();
    setSeries([
      { id: "yes", data: yArr, value: last.yes, color: "#16a34a", label: "Yes" },
      { id: "no", data: nArr, value: last.no, color: "#ef4444", label: "No" },
      { id: "other", data: oArr, value: last.other, color: "#94a3b8", label: "Other" },
    ]);

    const id = window.setInterval(() => {
      const t = tick();
      const { yes, no, other } = step();
      setSeries((prev) => {
        if (prev.length === 0) return prev;
        const append = (s: LivelineSeries, v: number): LivelineSeries => {
          const arr = [...s.data, { time: t, value: v }];
          return { ...s, value: v, data: arr.length > 300 ? arr.slice(-300) : arr };
        };
        return [
          append(prev[0], yes),
          append(prev[1], no),
          append(prev[2], other),
        ];
      });
    }, 500);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="lv-chart-host" data-h="lg">
      <Liveline
        data={[]}
        value={0}
        series={series}
        theme="light"
        formatValue={(v) => `${v.toFixed(1)}%`}
      />
    </div>
  );
}

/* ─── Stress test — switchable volatility, fast ticks, degen burst on swings. */

type Volatility = "calm" | "normal" | "spiky" | "chaos";
const VOL_LABEL: Record<Volatility, string> = {
  calm: "calm",
  normal: "normal",
  spiky: "spiky",
  chaos: "chaos",
};

/**
 * Stress test renders its OWN frame so the chip row can sit outside the dark
 * card (the page wrapper for this demo skips `.lv-demo-frame`).
 */
export function StressDemo() {
  const [data, setData] = useState<LivelinePoint[]>([]);
  const [value, setValue] = useState(100);
  const [vol, setVol] = useState<Volatility>("normal");
  const volRef = useRef<Volatility>(vol);
  volRef.current = vol;

  useEffect(() => {
    const tick = () => Date.now() / 1000;
    const scaleByVol: Record<Volatility, number> = {
      calm: 0.3,
      normal: 1.4,
      spiky: 4,
      chaos: 9,
    };
    let v = 100;
    const step = () => {
      const s = scaleByVol[volRef.current];
      const burst =
        (volRef.current === "spiky" || volRef.current === "chaos") &&
        Math.random() < 0.08
          ? (Math.random() - 0.5) * s * 4
          : 0;
      v += (Math.random() - 0.5) * s + burst;
      v += (100 - v) * 0.005; // gentle pull to 100
      return v;
    };

    const now = tick();
    const seed: LivelinePoint[] = [];
    for (let i = 120; i >= 0; i--) {
      seed.push({ time: now - i * 0.06, value: step() });
    }
    setData(seed);
    setValue(v);

    const id = window.setInterval(() => {
      const t = tick();
      const next = step();
      setValue(next);
      setData((prev) => {
        const arr = [...prev, { time: t, value: next }];
        return arr.length > 600 ? arr.slice(-600) : arr;
      });
    }, 60);

    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="art-demo-frame">
        <div className="lv-chart-host" data-h="lg">
          <Liveline
            data={data}
            value={value}
            color="#0ea5e9"
            theme="dark"
            window={20}
            degen={vol === "spiky" || vol === "chaos"}
            showValue
            valueMomentumColor
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      </div>
      <div className="lv-stress-controls">
        <div className="lv-chip-row">
          {(Object.keys(VOL_LABEL) as Volatility[]).map((k) => (
            <button
              key={k}
              type="button"
              className="lv-chip"
              data-active={vol === k}
              onClick={() => setVol(k)}
            >
              {VOL_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
