import ClickedButtonsContainer from "./components/clicked-buttons-container";
import AnalogTriggersContainer from "./components/analog-triggers-container";
// import CompetitionTimer from "./components/competition-timer";
import Communication from "../configurations/components/communication/communication";
// import SensorsDisplay from "./components/sensors-display";
import L2R2Triggers from "./components/L2R2Triggers";

export default function ControlPanel() {
  return (
    <div className="flex justify-center mt-20 px-2 gap-5 bg-gray">
      <ClickedButtonsContainer />
      <AnalogTriggersContainer />

      <div className="flex flex-col gap-5 bg-gray">
        <L2R2Triggers />
        <Communication />
      </div>
      {/* <div className="flex flex-col gap-5 bg-gray">
        <SensorsDisplay />
        <CompetitionTimer />
      </div> */}
    </div>
  );
}