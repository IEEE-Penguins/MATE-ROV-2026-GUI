/**
 * @file thruster.tsx
 * @version 2.0.0
 * @description The main container component for the "Thrusters Configuration" card,
 * updated to include a test slider and enable/disable toggle functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { socket, events } from "../../../../utils/socket/socket";
import Card from "../../../../components/card";
import ConfigurationRow from "../ConfigurationRow";

// ============================================================================
//                                  TYPES
// ============================================================================

interface Thruster {
  location: string;
  enabled: boolean;
  reversed: boolean;
}

// ============================================================================
//                        THRUSTER CONFIGURATION COMPONENT
// ============================================================================

export default function ThrusterConfiguration() {
  const [thrusters, setThrusters] = useState<Thruster[]>([]);

  // Effect to fetch initial configuration from the server
  useEffect(() => {
    const handleConfigData = (config: { thrusters?: Thruster[] }) => {
      if (config.thrusters && Array.isArray(config.thrusters)) {
        setThrusters(config.thrusters);
      }
    };
    socket.on("config:data", handleConfigData);
    events.getRovConfig();
    return () => {
      socket.off("config:data", handleConfigData);
    };
  }, []);

  // Effect to send debounced updates to the server when config changes
  useEffect(() => {
    if (thrusters.length === 0) return;
    const debounceTimer = setTimeout(() => {
      events.updateRovConfig({ thrusters });
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [thrusters]);

  /**
   * A single, unified handler for all changes to a thruster's state.
   * It now handles 'location', 'reversed', and the new 'enabled' property.
   */
  const handleThrusterChange = useCallback((
    index: number,
    key: "location" | "reversed" | "enabled",
    value: string | boolean
  ) => {
    setThrusters(currentThrusters => {
      const newThrusters = [...currentThrusters];
      newThrusters[index] = { ...newThrusters[index], [key]: value };
      return newThrusters;
    });
  }, []);


  const thrusterLocationOptions = [
    "frontLeft", "frontRight", "backLeft", "backRight", "topLeft", "topRight"
  ];

  if (thrusters.length === 0) {
    return <Card title="Thrusters Configuration"><p>Loading...</p></Card>;
  }

  return (
    <Card title="Thrusters Configuration">
      {/* Test Speed Slider Section */}
      {/* <div className="flex items-center justify-between text-sm px-2 text-gray-300">
        <span>Test Speed</span>
        <div className="w-44">
          <Slider value={testSpeed} onChange={handleTestSpeedChange} min={0} max={100} />
        </div>
        <span>{testSpeed}%</span>
      </div> */}

      {/* List of Thruster Configuration Rows */}
      <div className="flex flex-col gap-3">
        {thrusters.map((thruster, index) => (
          <ConfigurationRow
            key={index}
            label={`Thruster ${index + 1}`}
            enabled={thruster.enabled}
            onToggleEnabled={() => handleThrusterChange(index, "enabled", !thruster.enabled)}
            locationValue={thruster.location}
            locationOptions={thrusterLocationOptions}
            onLocationChange={(newLocation) => handleThrusterChange(index, "location", newLocation)}
            showReversed={true}
            reversedValue={thruster.reversed}
            onReversedChange={(isReversed) => handleThrusterChange(index, "reversed", isReversed)}
          />
        ))}
      </div>
    </Card>
  );
}
