import {Link, useLocation} from "react-router-dom";
import {useAtom} from "jotai";
import {
    obtainedPointsAtom,
    persistedTimeAtom,
} from "../../atoms/atoms";
import {useEffect, useState, useRef} from "react";

export default function Navbar() {
    const location = useLocation();

    // Time stored in milliseconds
    const [storedTime, setStoredTime] = useAtom(persistedTimeAtom);
    const [obtainedPoints] = useAtom(obtainedPointsAtom);
    const [running, setRunning] = useState(false);
    const [displayTime, setDisplayTime] = useState(storedTime);
    const startTimestampRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Timer Logic (requestAnimationFrame)
    useEffect(() => {
        if (running) {
            startTimestampRef.current = Date.now() - storedTime;

            const update = () => {
                const now = Date.now();
                const elapsed =
                    now - (startTimestampRef.current || now);
                setDisplayTime(elapsed);
                animationFrameRef.current =
                    requestAnimationFrame(update);
            };

            animationFrameRef.current = requestAnimationFrame(update);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            setStoredTime(displayTime);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [running]);

    // Format Time: HH : MM : SS : CS
    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        return (
            <div className="flex gap-2 font-mono text-xl md:text-2xl font-bold text-[#38bdf8] drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]">
                <span>{hours.toString().padStart(2, "0")}</span>
                <span className="text-slate-500">:</span>
                <span>{minutes.toString().padStart(2, "0")}</span>
                <span className="text-slate-500">:</span>
                <span>{seconds.toString().padStart(2, "0")}</span>
                <span className="text-slate-500">:</span>
                <span>
                    {centiseconds.toString().padStart(2, "0")}
                </span>
            </div>
        );
    };

    const handleReset = () => {
        setRunning(false);
        setStoredTime(0);
        setDisplayTime(0);
        localStorage.removeItem("competition-time");
    };

    const isActive = (path: string) =>
        location.pathname.includes(path)
            ? "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/50"
            : "text-slate-400 border-transparent hover:text-white";

    return (
        <nav className="fixed top-0 w-full h-16 z-50 flex items-center justify-between px-6 bg-[#00013f]/90 backdrop-blur-md border-b border-[#38bdf8]/20 font-sans shadow-lg">
            {/* LEFT: Logo */}
            <div className="flex items-center gap-4 group relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#38bdf8]/10 via-white/5 to-transparent rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>

                <div className="relative w-20 h-16 flex items-center justify-center drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_35px_rgba(56,189,248,0.8)] transition-all duration-500 hover:scale-110 hover:rotate-3">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1262 589"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                    >
                        <path
                            d="M450.308 305.518C454.22 291.427 456.523 276.938 457.173 262.327C458.751 219.562 452.439 178.47 426.827 142.79C409.847 119.12 386.997 104.917 356.525 108.815C327.6 112.571 308.695 129.898 298.69 156.63C290.437 178.644 289.222 201.667 292.031 224.959C292.393 227.381 293.669 229.572 295.597 231.082C300.978 236.116 306.643 240.929 311.725 246.184C316.806 251.439 316.916 254.406 311.882 259.803C299.984 272.495 287.236 284.363 273.725 295.324C267.413 300.453 264.02 300.563 257.945 295.656C244.163 284.377 231.162 272.177 219.03 259.14C214.296 254.137 214.549 251.044 219.661 246.026C225.043 240.708 230.708 235.737 236.326 230.609C237.158 230.015 237.864 229.264 238.406 228.398C238.947 227.531 239.313 226.567 239.482 225.559C242.117 196.996 240.886 168.749 225.989 143.501C201.972 102.645 152.232 96.1593 116.852 128.714C94.9485 148.74 84.5176 174.935 78.7262 203.34C71.9248 236.668 71.7513 269.918 80.6357 302.978C80.7107 303.66 80.7107 304.348 80.6357 305.029C76.6432 304.524 73.5502 302.504 70.4415 300.784C60.3177 295.014 50.5719 288.605 41.2634 281.595C39.0652 280.107 37.2732 278.093 36.0497 275.737C34.8262 273.381 34.21 270.757 34.2569 268.103C32.884 210.41 43.7252 155.62 74.9705 106.401C112.686 46.8927 166.75 11.3709 236.909 2.09199C286.965 -4.5358 334.37 4.5064 378.034 30.339C441.456 67.786 475.968 125.274 491.196 195.75C496.324 219.42 496.829 243.643 496.955 267.803C496.955 273.011 495.898 277.398 491.369 280.633C478.729 289.612 466.278 298.828 450.308 305.518Z"
                            fill="url(#grad1)"
                        />
                        <path
                            d="M361.858 171.668C367.858 170.188 374.038 169.571 380.211 169.838C391.052 170.5 393.356 176.671 385.056 182.651C376.108 189.074 358.229 193.903 346.678 192.988C334.669 192.025 333.106 184.924 343.521 178.69C349.281 175.515 355.451 173.152 361.858 171.668Z"
                            fill="url(#grad2)"
                        />
                        <path
                            d="M167.002 171.668C161.003 170.188 154.823 169.571 148.65 169.838C137.809 170.5 135.505 176.671 143.805 182.651C152.753 189.074 170.632 193.903 182.183 192.988C194.192 192.025 195.754 184.924 185.339 178.69C179.58 175.515 173.409 173.152 167.002 171.668Z"
                            fill="url(#grad2)"
                        />
                        <path
                            d="M26.7066 505.146C20.7178 505.146 16.3477 503.204 13.5961 499.319C10.8445 495.273 9.95427 489.85 10.9254 483.052L32.0479 350.491C32.8572 344.178 35.1232 339.484 38.8459 336.409C42.5687 333.334 47.5863 331.796 53.8987 331.796H104.156C124.064 331.796 139.036 336.085 149.071 344.664C159.106 353.08 164.124 364.977 164.124 380.353C164.124 399.615 158.216 414.586 146.401 425.269C134.585 435.952 117.428 441.293 94.9298 441.293H55.1127L48.0718 486.209C47.1007 492.521 44.8347 497.296 41.2738 500.533C37.7129 503.608 32.8572 505.146 26.7066 505.146ZM59.9684 412.159H96.3865C106.745 412.159 114.596 409.731 119.937 404.875C125.278 399.857 127.949 392.736 127.949 383.51C127.949 375.74 125.602 370.075 120.908 366.515C116.214 362.954 109.092 361.173 99.5427 361.173H67.9804L59.9684 412.159ZM190.603 502.961C183.643 502.961 178.626 501.18 175.55 497.62C172.475 493.897 171.423 488.636 172.394 481.838L193.274 350.005C194.245 344.016 196.511 339.484 200.072 336.409C203.633 333.334 208.407 331.796 214.396 331.796H297.915C302.933 331.796 306.736 332.848 309.326 334.952C312.078 336.895 313.453 339.808 313.453 343.693C313.453 349.196 311.835 353.485 308.598 356.56C305.522 359.636 301.314 361.173 295.973 361.173H227.507L221.194 401.233H281.648C286.666 401.233 290.469 402.285 293.059 404.389C295.649 406.494 296.944 409.407 296.944 413.13C296.944 418.633 295.325 423.003 292.088 426.24C289.013 429.316 284.885 430.853 279.706 430.853H216.581L209.783 473.584H275.336C280.353 473.584 284.157 474.636 286.747 476.74C289.498 478.682 290.874 481.596 290.874 485.48C290.874 490.983 289.256 495.273 286.018 498.348C282.943 501.423 278.735 502.961 273.393 502.961H190.603ZM334.204 505.146C328.701 505.146 324.493 503.366 321.579 499.805C318.828 496.082 317.937 490.903 318.908 484.266L341.002 345.635C341.973 340.294 343.916 336.328 346.829 333.738C349.904 330.987 353.708 329.611 358.24 329.611C363.096 329.611 366.737 330.582 369.165 332.524C371.755 334.305 374.345 337.299 376.935 341.508L443.701 453.19H437.146L453.898 347.092C454.869 341.103 456.973 336.733 460.211 333.981C463.61 331.068 468.222 329.611 474.049 329.611C479.553 329.611 483.518 331.472 485.946 335.195C488.536 338.756 489.345 343.774 488.374 350.248L466.523 488.879C465.714 494.221 463.933 498.267 461.182 501.019C458.43 503.77 454.788 505.146 450.256 505.146C445.401 505.146 441.516 504.175 438.602 502.233C435.689 500.29 432.937 497.215 430.348 493.007L363.581 381.567H370.137L353.384 487.665C352.575 493.492 350.633 497.862 347.557 500.776C344.482 503.689 340.031 505.146 334.204 505.146ZM588.391 505.632C572.529 505.632 558.447 502.718 546.146 496.891C533.845 490.903 524.214 482.162 517.254 470.67C510.456 459.016 507.057 444.935 507.057 428.425C507.057 414.182 509.161 401.071 513.37 389.094C517.578 376.954 523.89 366.434 532.307 357.531C540.724 348.629 550.921 341.669 562.898 336.652C574.876 331.634 588.714 329.125 604.415 329.125C613.479 329.125 622.138 330.177 630.393 332.282C638.648 334.224 645.769 336.895 651.758 340.294C655.805 342.398 658.556 345.149 660.013 348.548C661.47 351.785 661.874 355.104 661.227 358.503C660.579 361.902 659.123 364.896 656.857 367.486C654.753 370.075 652.082 371.775 648.845 372.584C645.608 373.394 641.966 372.827 637.919 370.885C632.578 367.648 626.913 365.382 620.924 364.087C614.935 362.63 608.785 361.902 602.472 361.902C590.495 361.902 580.298 364.815 571.881 370.642C563.465 376.469 557.071 384.319 552.701 394.192C548.331 403.904 546.146 414.748 546.146 426.726C546.146 442.75 550.354 454.565 558.771 462.173C567.187 469.78 578.922 473.584 593.975 473.584C599.64 473.584 605.224 473.098 610.727 472.127C616.23 470.994 621.733 469.537 627.237 467.757L618.254 482.324L625.78 435.709H604.415C599.559 435.709 595.755 434.657 593.004 432.553C590.252 430.449 588.876 427.616 588.876 424.055C588.876 419.038 590.414 415.234 593.489 412.644C596.565 409.893 600.773 408.517 606.114 408.517H643.503C649.007 408.517 653.053 410.054 655.643 413.13C658.394 416.205 659.285 420.494 658.313 425.997L649.573 481.353C648.926 485.723 647.469 489.365 645.203 492.278C643.099 495.03 639.862 497.134 635.491 498.591C628.532 500.857 620.924 502.556 612.669 503.689C604.415 504.984 596.322 505.632 588.391 505.632ZM754.745 505.632C743.739 505.632 733.785 504.013 724.883 500.776C715.98 497.539 708.535 492.683 702.546 486.209C696.557 479.734 692.349 471.56 689.921 461.687C687.493 451.814 687.332 440.241 689.436 426.969L702.303 347.334C703.113 341.346 705.217 336.895 708.616 333.981C712.177 331.068 716.871 329.611 722.698 329.611C729.01 329.611 733.623 331.472 736.536 335.195C739.45 338.756 740.34 343.854 739.207 350.491L726.825 429.396C724.721 443.64 726.177 454.565 731.195 462.173C736.375 469.78 745.196 473.584 757.659 473.584C769.313 473.584 778.62 470.508 785.579 464.358C792.539 458.045 797.071 448.334 799.175 435.223L813.014 347.334C813.985 341.346 816.171 336.895 819.57 333.981C823.13 331.068 827.824 329.611 833.651 329.611C839.802 329.611 844.253 331.391 847.005 334.952C849.918 338.513 850.889 343.693 849.918 350.491L836.807 434.009C834.38 449.386 829.848 462.415 823.211 473.098C816.737 483.781 807.916 491.874 796.748 497.377C785.579 502.88 771.579 505.632 754.745 505.632ZM878.607 505.146C872.132 505.146 867.519 503.204 864.768 499.319C862.016 495.273 861.207 489.77 862.34 482.81L883.705 348.548C884.676 342.236 886.942 337.542 890.503 334.467C894.064 331.23 898.92 329.611 905.07 329.611C911.383 329.611 915.834 331.553 918.424 335.438C921.175 339.322 921.985 344.826 920.852 351.947L899.486 485.966C898.515 492.278 896.33 497.053 892.931 500.29C889.532 503.527 884.757 505.146 878.607 505.146ZM949.47 505.146C943.967 505.146 939.759 503.366 936.845 499.805C934.094 496.082 933.203 490.903 934.175 484.266L956.268 345.635C957.239 340.294 959.182 336.328 962.095 333.738C965.17 330.987 968.974 329.611 973.506 329.611C978.362 329.611 982.004 330.582 984.432 332.524C987.021 334.305 989.611 337.299 992.201 341.508L1058.97 453.19H1052.41L1069.16 347.092C1070.14 341.103 1072.24 336.733 1075.48 333.981C1078.88 331.068 1083.49 329.611 1089.32 329.611C1094.82 329.611 1098.78 331.472 1101.21 335.195C1103.8 338.756 1104.61 343.774 1103.64 350.248L1081.79 488.879C1080.98 494.221 1079.2 498.267 1076.45 501.019C1073.7 503.77 1070.05 505.146 1065.52 505.146C1060.67 505.146 1056.78 504.175 1053.87 502.233C1050.96 500.29 1048.2 497.215 1045.61 493.007L978.847 381.567H985.403L968.65 487.665C967.841 493.492 965.899 497.862 962.823 500.776C959.748 503.689 955.297 505.146 949.47 505.146ZM1179.38 505.632C1172.74 505.632 1166.11 505.146 1159.47 504.175C1152.83 503.204 1146.28 501.747 1139.8 499.805C1133.49 497.701 1127.58 495.192 1122.08 492.278C1118.36 490.174 1115.77 487.584 1114.31 484.509C1113.02 481.272 1112.61 478.035 1113.1 474.798C1113.58 471.56 1114.88 468.728 1116.98 466.3C1119.09 463.71 1121.76 462.092 1124.99 461.444C1128.23 460.635 1131.95 461.282 1136.16 463.387C1143.61 467.271 1151.38 470.104 1159.47 471.884C1167.72 473.503 1175.49 474.312 1182.78 474.312C1193.14 474.312 1201.15 472.451 1206.81 468.728C1212.64 465.005 1215.55 460.23 1215.55 454.404C1215.55 449.71 1213.85 445.825 1210.45 442.75C1207.06 439.674 1201.39 437.247 1193.46 435.466L1166.02 428.911C1154.05 426.159 1144.5 421.061 1137.38 413.615C1130.42 406.17 1126.94 396.539 1126.94 384.724C1126.94 375.983 1128.72 368.214 1132.28 361.416C1136 354.456 1141.1 348.629 1147.57 343.935C1154.21 339.08 1161.74 335.438 1170.15 333.01C1178.73 330.42 1187.71 329.125 1197.1 329.125C1205.19 329.125 1213.93 330.177 1223.32 332.282C1232.87 334.386 1241.69 337.866 1249.79 342.721C1253.02 344.664 1255.29 347.173 1256.58 350.248C1257.88 353.161 1258.28 356.237 1257.8 359.474C1257.47 362.549 1256.26 365.22 1254.16 367.486C1252.21 369.752 1249.46 371.208 1245.9 371.856C1242.5 372.341 1238.38 371.451 1233.52 369.185C1228.18 366.434 1222.19 364.33 1215.55 362.873C1209.08 361.254 1202.77 360.445 1196.62 360.445C1190.14 360.445 1184.4 361.335 1179.38 363.116C1174.52 364.896 1170.72 367.324 1167.97 370.399C1165.38 373.474 1164.08 377.116 1164.08 381.325C1164.08 386.18 1165.62 390.065 1168.7 392.978C1171.93 395.73 1176.71 397.915 1183.02 399.534L1210.21 406.089C1224.13 409.326 1234.65 414.748 1241.77 422.356C1249.06 429.963 1252.7 439.108 1252.7 449.791C1252.7 459.178 1250.76 467.352 1246.87 474.312C1242.99 481.272 1237.57 487.099 1230.61 491.793C1223.81 496.325 1215.96 499.805 1207.06 502.233C1198.32 504.499 1189.09 505.632 1179.38 505.632Z"
                            fill="white"
                        />
                        <defs>
                            <linearGradient
                                id="grad1"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    style={{
                                        stopColor: "#ffffff",
                                        stopOpacity: 1,
                                    }}
                                />
                                <stop
                                    offset="50%"
                                    style={{
                                        stopColor: "#ffffff",
                                        stopOpacity: 0.9,
                                    }}
                                />
                                <stop
                                    offset="100%"
                                    style={{
                                        stopColor: "#ffffff",
                                        stopOpacity: 1,
                                    }}
                                />
                            </linearGradient>
                            <linearGradient
                                id="grad2"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    style={{
                                        stopColor: "#38bdf8",
                                        stopOpacity: 1,
                                    }}
                                />
                                <stop
                                    offset="100%"
                                    style={{
                                        stopColor: "#0ea5e9",
                                        stopOpacity: 1,
                                    }}
                                />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>

                    <h1 className="relative font-black text-lg tracking-wider bg-gradient-to-r from-white via-[#38bdf8] to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)] hover:drop-shadow-[0_4px_20px_rgba(56,189,248,0.8)] transition-all duration-300 animate-[shimmer_3s_ease-in-out_infinite] leading-tight">
                        MATE ROV{" "}
                        <span className="text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,1)]">
                            '26
                        </span>
                    </h1>

                    <div className="relative mt-0.5 flex items-center gap-2">
                        <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-[#38bdf8] to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* CENTER: Competition Timer */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center top-1">
                <div className="relative flex items-center justify-center">
                    <div className="bg-black/80 px-6 py-1 rounded-lg border border-[#38bdf8]/30 shadow-[0_0_15px_rgba(56,189,248,0.15)] min-w-[240px] flex justify-center">
                        {formatTime(displayTime)}
                    </div>
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/80 px-3 py-1 rounded-lg border border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.2)] min-w-[120px] flex items-center justify-center gap-2">
                        <span className="text-[11px] font-semibold tracking-wide text-emerald-300">
                            POINTS
                        </span>
                        <span className="font-mono text-lg font-bold text-emerald-200">
                            {obtainedPoints}
                        </span>
                    </div>
                </div>

                {/* Timer Controls */}
                <div className="flex gap-2 mt-1 opacity-80 hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setRunning(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-green-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
                        title="Start Timer"
                    >
                        <i className="fas fa-play text-[10px]"></i>
                    </button>
                    <button
                        onClick={() => setRunning(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-yellow-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
                        title="Pause Timer"
                    >
                        <i className="fas fa-pause text-[10px]"></i>
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-slate-800 hover:bg-slate-700 text-red-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
                        title="Reset Timer"
                    >
                        <i className="fas fa-undo text-[10px]"></i>
                    </button>
                </div>
            </div>

            {/* RIGHT: Navigation Icons */}
            <div className="flex gap-3">
                <Link
                    to="/camera"
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("camera")}`}
                    title="Camera Feed"
                >
                    <i className="fas fa-video"></i>
                </Link>
                <Link
                    to="/control-panel"
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("control-panel")}`}
                    title="Control Panel"
                >
                    <i className="fas fa-gamepad"></i>
                </Link>
                <Link
                    to="/configurations"
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("configurations")}`}
                    title="Settings"
                >
                    <i className="fas fa-cog"></i>
                </Link>
            </div>
        </nav>
    );
}
