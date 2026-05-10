import IcebergThreatPanel from "../camera-feed/components/IcebergThreatPanel";
import Task25Panel from "../camera-feed/components/Task25Panel";
import {RiBarChartBoxLine, RiShipLine} from "react-icons/ri";

export default function NonCamTasks() {
    return (
        <div className="relative min-h-screen bg-[#020617] pt-20 overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                            <RiShipLine className="text-cyan-300" />
                            <span>Iceberg Threat Calculations</span>
                        </div>
                        <IcebergThreatPanel variant="page" />
                    </section>

                    <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                            <RiBarChartBoxLine className="text-emerald-300" />
                            <span>Holyrood Observatory Service</span>
                        </div>
                        <Task25Panel variant="page" />
                    </section>
                </div>
            </div>
        </div>
    );
}
