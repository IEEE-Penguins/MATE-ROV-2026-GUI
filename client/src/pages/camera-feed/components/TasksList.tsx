import {useEffect, useState} from "react";
import {useAtom} from "jotai";
import {
    checkedSubtasksAtom,
    obtainedPointsAtom,
} from "../../../../atoms/atoms";

type Subtask = {
    id: string;
    label: string;
    points: number;
};

type MissionTask = {
    id: string;
    title: string;
    subtasks: Subtask[];
};

const TASKS: MissionTask[] = [
    {
        id: "task1",
        title: "Task 1: Seabed 2030",
        subtasks: [
            {
                id: "1.1",
                label: "Collect species from the coral garden",
                points: 30,
            },
            {
                id: "1.2",
                label: "Create a scaled 3D coral garden model",
                points: 30,
            },
            {
                id: "1.3",
                label: "Maintain position and fly transect video",
                points: 10,
            },
        ],
    },
    {
        id: "task2",
        title: "Task 2: SmartAtlantic Alliance",
        subtasks: [
            {
                id: "2.1",
                label: "Determine invasive Green Crab count",
                points: 15,
            },
            {
                id: "2.2",
                label: "Survey iceberg and report threat level",
                points: 25,
            },
            {
                id: "2.3",
                label: "Release whale-safe gear and recover pot",
                points: 15,
            },
            {
                id: "2.4",
                label: "Attach and return anchor recovery line",
                points: 15,
            },
            {
                id: "2.5",
                label: "Service Holyrood observatory eDNA station",
                points: 45,
            },
        ],
    },
    {
        id: "task3",
        title: "Task 3: Wind-Powered Platform",
        subtasks: [
            {
                id: "3.1",
                label: "Place bubble curtain and install micropile",
                points: 30,
            },
            {
                id: "3.2",
                label: "Retrieve connector and pass waypoint",
                points: 20,
            },
            {
                id: "3.3",
                label: "Remove port cover and install connector",
                points: 20,
            },
        ],
    },
];

const calculateTotalPoints = (
    checkedTasks: Record<string, boolean>,
) =>
    TASKS.reduce(
        (taskTotal, task) =>
            taskTotal +
            task.subtasks.reduce(
                (subtaskTotal, subtask) =>
                    subtaskTotal +
                    (checkedTasks[subtask.id] ? subtask.points : 0),
                0,
            ),
        0,
    );

const TasksList = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [checkedTasks, setCheckedTasks] = useAtom(
        checkedSubtasksAtom,
    );
    const [, setObtainedPoints] = useAtom(obtainedPointsAtom);

    useEffect(() => {
        setObtainedPoints(calculateTotalPoints(checkedTasks));
    }, [checkedTasks, setObtainedPoints]);

    const toggleTask = (id: string) => {
        setCheckedTasks((prev) => {
            const nextChecked = {
                ...prev,
                [id]: !prev[id],
            };
            return nextChecked;
        });
    };

    return (
        <div className="fixed left-52 bottom-0 z-40 w-full pointer-events-none">
            <div className="relative pointer-events-auto">
                {isExpanded && (
                    <div className="absolute bottom-4 left-0  bg-black/80 backdrop-blur-lg border-t border-cyan-400/20 p-4 mx-6 rounded-t-lg">
                        <div className="max-w-5xl">
                            <div className="flex gap-4 items-start">
                                <div>
                                    <p className="text-cyan-600 text-xs tracking-wider mb-2 font-semibold">
                                        THRUSTERS STATUS
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-6 bg-cyan-400 rounded"></div>
                                            <div className="w-2 h-6 bg-cyan-400 rounded"></div>
                                            <div className="w-2 h-6 bg-cyan-400 rounded"></div>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-6 bg-cyan-400 rounded"></div>
                                            <div className="w-2 h-6 bg-cyan-400/30 rounded"></div>
                                            <div className="w-2 h-6 bg-cyan-400 rounded"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 flex-1">
                                    {TASKS.map((task) => (
                                        <div
                                            key={task.id}
                                            className="bg-cyan-500/8 backdrop-blur-sm border border-cyan-400/20 rounded p-2"
                                        >
                                            <div className="text-cyan-400 font-bold text-xs mb-1">
                                                {task.title.toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5 text-xs">
                                                {task.subtasks.map(
                                                    (subtask) => (
                                                        <div
                                                            key={
                                                                subtask.id
                                                            }
                                                            className="flex items-center gap-1"
                                                        >
                                                            <input
                                                                id={`subtask-${subtask.id}`}
                                                                type="checkbox"
                                                                className="w-3 h-3 cursor-pointer"
                                                                checked={
                                                                    !!checkedTasks[
                                                                        subtask
                                                                            .id
                                                                    ]
                                                                }
                                                                onChange={() =>
                                                                    toggleTask(
                                                                        subtask.id,
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`subtask-${subtask.id}`}
                                                                className="text-cyan-400/60 cursor-pointer select-none"
                                                            >
                                                                {
                                                                    subtask.id
                                                                }{" "}
                                                                {
                                                                    subtask.label
                                                                }{" "}
                                                                (
                                                                {
                                                                    subtask.points
                                                                }{" "}
                                                                pts)
                                                            </label>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* home indicator */}
                <div className="w-full flex justify-center py-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-40 h-1.5 bg-black rounded-full -translate-x-52"
                    />
                </div>
            </div>
        </div>
    );
};

export default TasksList;
