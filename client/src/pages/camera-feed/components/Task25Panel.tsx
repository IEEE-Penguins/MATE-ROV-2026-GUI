import {useEffect, useMemo, useState} from "react";
import {RiBarChartBoxLine} from "react-icons/ri";

type HolyroodSpecies = {
    id: string;
    name: string;
};

type FrequencyRow = {
    id: string;
    count: number;
    percentage: number;
};

type FrequencyCalculation = {
    total: number;
    rows: FrequencyRow[];
    calculatedAt: string;
};

type StoredTask25State = {
    counts: number[];
    sensorRecovered: boolean;
};

const HOLYROOD_SPECIES: HolyroodSpecies[] = [
    {
        id: "snow-crab",
        name: "Snow crab (chionecetes opilio)",
    },
    {
        id: "acadian-hermit-crab",
        name: "Acadian hermit crab (Pagarus acadianus)",
    },
    {
        id: "western-atlantic-hairy-hermit-crab",
        name: "Western Atlantic Hairy Hermit Crab (Pagarus arcuatus)",
    },
    {
        id: "european-green-crab",
        name: "European Green Crab (Carcinus maenas)",
    },
    {
        id: "rock-crab",
        name: "Rock Crab (Cancer pagurus)",
    },
    {
        id: "jonah-crab",
        name: "Jonah Crab (Cancer borealis)",
    },
    {
        id: "spiny-sunstar",
        name: "Spiny Sunstar (Crossaster papposus)",
    },
    {
        id: "sea-urchin",
        name: "Sea Urchin (Stronglyocentrotus droebachiensis)",
    },
    {
        id: "boreal-sea-star",
        name: "Boreal Sea Star (Boreal asterias)",
    },
    {
        id: "daisy-brittle-star",
        name: "Daisy brittle star (Ophiopholis aculeata)",
    },
];

const DEFAULT_COUNTS = [19, 3, 1, 9, 10, 5, 8, 10, 12, 7];
const TASK25_STORAGE_KEY = "task25-holyrood-observatory";

const isTransientNumericInput = (value: string) => {
    return value === "" || value === "-";
};

const sanitizeCount = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.trunc(value));
};

const csvEscape = (value: string) => {
    return `"${value.replace(/"/g, '""')}"`;
};

const buildFrequencyCalculation = (
    counts: number[],
): FrequencyCalculation => {
    const total = counts.reduce((sum, count) => sum + count, 0);

    const rows = HOLYROOD_SPECIES.map((species, index) => {
        const count = counts[index] ?? 0;
        return {
            id: species.id,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
        };
    });

    return {
        total,
        rows,
        calculatedAt: new Date().toISOString(),
    };
};

export default function Task25Panel() {
    const [counts, setCounts] = useState<number[]>(DEFAULT_COUNTS);
    const [draftCounts, setDraftCounts] = useState<string[]>(
        DEFAULT_COUNTS.map((count) => String(count)),
    );
    const [sensorRecovered, setSensorRecovered] = useState(false);
    const [calculation, setCalculation] =
        useState<FrequencyCalculation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(TASK25_STORAGE_KEY);
            if (!saved) return;

            const parsed = JSON.parse(saved) as Partial<StoredTask25State>;
            const storedCounts = parsed.counts;
            const hasValidCounts =
                Array.isArray(storedCounts) &&
                storedCounts.length === HOLYROOD_SPECIES.length;

            if (hasValidCounts) {
                const normalizedCounts = storedCounts.map((value) =>
                    sanitizeCount(Number(value)),
                );
                setCounts(normalizedCounts);
                setDraftCounts(
                    normalizedCounts.map((value) => String(value)),
                );
            }

            if (typeof parsed.sensorRecovered === "boolean") {
                setSensorRecovered(parsed.sensorRecovered);
            }
        } catch {
            // Ignore malformed browser storage data.
        }
    }, []);

    useEffect(() => {
        const persistedState: StoredTask25State = {
            counts,
            sensorRecovered,
        };
        localStorage.setItem(
            TASK25_STORAGE_KEY,
            JSON.stringify(persistedState),
        );
    }, [counts, sensorRecovered]);

    const currentTotal = useMemo(
        () => counts.reduce((sum, count) => sum + count, 0),
        [counts],
    );

    const score = useMemo(() => {
        const recoveryPoints = sensorRecovered ? 5 : 0;
        const frequencyPoints =
            calculation && calculation.total > 0 ? 10 : 0;
        return recoveryPoints + frequencyPoints;
    }, [sensorRecovered, calculation]);

    const handleInputChange =
        (index: number) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value;

            setDraftCounts((prev) => {
                const next = [...prev];
                next[index] = raw;
                return next;
            });

            if (isTransientNumericInput(raw)) return;

            const parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed < 0) return;

            const normalized = sanitizeCount(parsed);
            setCounts((prev) => {
                const next = [...prev];
                next[index] = normalized;
                return next;
            });
            setCalculation(null);
            setError(null);
        };

    const handleInputBlur =
        (index: number) =>
        () => {
            const raw = draftCounts[index];

            if (isTransientNumericInput(raw)) {
                setDraftCounts((prev) => {
                    const next = [...prev];
                    next[index] = String(counts[index]);
                    return next;
                });
                return;
            }

            const parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed < 0) {
                setDraftCounts((prev) => {
                    const next = [...prev];
                    next[index] = String(counts[index]);
                    return next;
                });
                return;
            }

            const normalized = sanitizeCount(parsed);
            setDraftCounts((prev) => {
                const next = [...prev];
                next[index] = String(normalized);
                return next;
            });
            setCounts((prev) => {
                const next = [...prev];
                next[index] = normalized;
                return next;
            });
            setCalculation(null);
            setError(null);
        };

    const calculateFrequencyTable = () => {
        const result = buildFrequencyCalculation(counts);
        if (result.total <= 0) {
            setError(
                "Enter at least one organism count before calculating percentage frequency.",
            );
            setCalculation(null);
            return;
        }

        setCalculation(result);
        setError(null);
    };

    const exportFrequencyCsv = () => {
        const result = buildFrequencyCalculation(counts);
        if (result.total <= 0) {
            setError(
                "Enter at least one organism count before exporting CSV.",
            );
            setCalculation(null);
            return;
        }

        setCalculation(result);
        setError(null);

        const generatedAt = new Date();
        const generatedAtLabel = generatedAt.toLocaleString();
        const timestampSlug = generatedAt
            .toISOString()
            .replace(/[:.]/g, "-");

        const rows: string[][] = [
            [
                "Task",
                "2.5 Service the Holyrood subsea observatory",
            ],
            ["Generated At", generatedAtLabel],
            [
                "Sensor Recovered To Pool Deck",
                sensorRecovered ? "Yes" : "No",
            ],
            ["Recovery Points", sensorRecovered ? "5" : "0"],
            ["Frequency Table Points", "10"],
            [
                "Total Score",
                `${(sensorRecovered ? 5 : 0) + 10} / 15`,
            ],
            [],
            ["Species", "Number Seen", "Percent Frequency"],
            ...HOLYROOD_SPECIES.map((species, index) => [
                species.name,
                String(result.rows[index].count),
                result.rows[index].percentage.toFixed(8),
            ]),
            ["Total", String(result.total), "100.00000000"],
        ];

        const csvText = rows
            .map((row) => row.map((cell) => csvEscape(cell)).join(","))
            .join("\n");

        const blob = new Blob([csvText], {
            type: "text/csv;charset=utf-8",
        });
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download =
            `task2-5-holyrood-frequency-${timestampSlug}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(downloadUrl);
    };

    return (
        <div className="absolute right-20 bottom-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-[62rem] max-w-[calc(100vw-3rem)] max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-600/60">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 border border-cyan-500 rounded">
                        <RiBarChartBoxLine className="text-cyan-400 text-lg" />
                    </div>
                    <h2 className="text-base font-bold text-white tracking-wide uppercase">
                        Task 2.5: Service the Holyrood Subsea Observatory
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportFrequencyCsv}
                        className="px-3 py-1.5 rounded-md text-xs font-bold tracking-wider border border-emerald-500/60 text-emerald-200 bg-emerald-900/30 hover:bg-emerald-800/40"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={calculateFrequencyTable}
                        className="px-3 py-1.5 rounded-md text-xs font-bold tracking-wider border border-cyan-500/60 text-cyan-200 bg-cyan-900/30 hover:bg-cyan-800/40"
                    >
                        Calculate
                    </button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3">
                <div className="rounded-lg border border-cyan-900/60 bg-[#040c0f] px-3 py-3">
                    <p className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wide mb-2">
                        Recovery Checklist (5 pts)
                    </p>
                    <label className="flex items-center gap-2 text-sm text-white">
                        <input
                            type="checkbox"
                            checked={sensorRecovered}
                            onChange={(event) =>
                                setSensorRecovered(event.target.checked)}
                            className="h-4 w-4"
                        />
                        Old eDNA sensor recovered and placed on pool deck
                    </label>
                </div>

                <div className="rounded-lg border border-cyan-900/60 bg-[#040c0f] px-3 py-3">
                    <p className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wide mb-2">
                        Scoring Snapshot
                    </p>
                    <div className="space-y-1 text-xs text-gray-200">
                        <div className="flex items-center justify-between">
                            <span>Recovery</span>
                            <span className="font-semibold text-cyan-100">
                                {sensorRecovered ? "5 / 5" : "0 / 5"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Frequency Table</span>
                            <span className="font-semibold text-cyan-100">
                                {calculation && calculation.total > 0
                                    ? "10 / 10"
                                    : "0 / 10"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-cyan-900/60 pt-1.5 mt-1.5">
                            <span className="font-semibold">Total</span>
                            <span className="font-semibold text-emerald-300">
                                {score} / 15
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-3 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-cyan-900/60">
                <table className="min-w-full text-xs text-left text-gray-200">
                    <thead className="bg-[#061119] text-cyan-300 uppercase tracking-wide">
                        <tr>
                            <th className="px-3 py-2">Species</th>
                            <th className="px-3 py-2 w-36">Number Seen</th>
                            <th className="px-3 py-2 w-36">% Frequency</th>
                        </tr>
                    </thead>
                    <tbody>
                        {HOLYROOD_SPECIES.map((species, index) => (
                            <tr
                                key={species.id}
                                className="border-t border-cyan-900/40 bg-black/30"
                            >
                                <td className="px-3 py-2 text-white font-medium">
                                    {species.name}
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={draftCounts[index]}
                                        onChange={handleInputChange(index)}
                                        onBlur={handleInputBlur(index)}
                                        className="w-24 bg-[#040c0f] border border-cyan-900/50 px-2 py-1 rounded text-sm text-white focus:border-cyan-400 focus:outline-none"
                                    />
                                </td>
                                <td className="px-3 py-2 font-semibold text-cyan-100">
                                    {calculation
                                        ? `${calculation.rows[index].percentage.toFixed(8)}%`
                                        : "--"}
                                </td>
                            </tr>
                        ))}
                        <tr className="border-t border-cyan-500/50 bg-cyan-950/20">
                            <td className="px-3 py-2 font-bold text-cyan-200 uppercase tracking-wide">
                                Total Count
                            </td>
                            <td className="px-3 py-2 font-bold text-white">
                                {currentTotal}
                            </td>
                            <td className="px-3 py-2 font-bold text-cyan-200">
                                {calculation ? "100.00000000%" : "--"}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                    Formula: frequency (%) = (number seen / total count) x 100
                </span>
                <span>
                    {calculation
                        ? `Last calculated at ${new Date(calculation.calculatedAt).toLocaleTimeString()}`
                        : "Enter values and click Calculate"}
                </span>
            </div>
        </div>
    );
}
