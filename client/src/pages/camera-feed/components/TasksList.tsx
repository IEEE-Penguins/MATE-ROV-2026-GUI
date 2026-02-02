import { useState } from 'react';

const TASKS = {
  task1: [
    { id: "1.1", label: "1.1 Species Collection" },
    { id: "1.2", label: "1.2 Coral Ridge Model" },
    { id: "1.3", label: "1.3 Fly Transect" },
  ],
  task2: [
    { id: "2.1", label: "2.1 Count Green Crabs" },
    { id: "2.2", label: "2.2 Iceberg Tracking" },
    { id: "2.3", label: "2.3 Whale Safe Gear" },
    { id: "2.4", label: "2.4 Recover Anchor" },
    { id: "2.5", label: "2.5 Service Observatory" },
  ],
  task3: [
    { id: "3.1", label: "3.1 Install Micropile" },
    { id: "3.2", label: "3.2 Power Connection" },
  ],
  task4: [
    { id: "4.1", label: "4.1 Float Profiling" },
  ]
};

const TasksList = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<{ [key: string]: boolean }>({});

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed left-52 bottom-0 z-40 w-full pointer-events-none">
      <div className="relative pointer-events-auto">
        {isExpanded && (
          <div className="absolute bottom-4 left-0 bg-[#0B1120]/60 backdrop-blur-lg border-t border-cyan-400/20 p-4 mx-6 rounded-t-lg">
            <div className="max-w-5xl">
              <div className="flex gap-4 items-start">
                <div>
                  <p className="text-cyan-600 text-xs tracking-wider mb-2 font-semibold">THRUSTERS STATUS</p>
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

                <div className="grid grid-cols-5 gap-2 flex-1">
                  {Object.entries(TASKS).map(([taskGroup, tasks]) => (
                    <div key={taskGroup} className="bg-cyan-500/8 backdrop-blur-sm border border-cyan-400/20 rounded p-2">
                      <div className="text-cyan-400 font-bold text-xs mb-1">{taskGroup.toUpperCase()}</div>
                      <div className="space-y-0.5 text-xs">
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              className="w-2 h-2"
                              checked={!!checkedTasks[task.id]}
                              onChange={() => toggleTask(task.id)}
                            />
                            <span className="text-cyan-400/60">{task.label}</span>
                          </div>
                        ))}
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