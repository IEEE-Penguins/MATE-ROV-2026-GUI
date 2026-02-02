import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout";
import ControlPanel from "./pages/control-panel/page";
import Configurations from "./pages/configurations/page";
import ControllerData from "./pages/configurations/components/communication/controllerData";
import CameraFeed from "./pages/camera-feed/page";

export default function App() {
  ControllerData();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/control-panel" replace />} />
          <Route path="*" element={<Navigate to="/control-panel" replace />} />
          <Route path="camera" element={<CameraFeed/>} />
          <Route path="control-panel" element={<ControlPanel />} />
          <Route path="configurations" element={<Configurations />} />
        </Route>
      </Routes>
    </Router>
  );
}