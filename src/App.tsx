import { useState } from "react";
import { RoleSelect }     from "./components/RoleSelect";
import { ViewerView }     from "./components/viewer/ViewerView";
import { TimerOnlyView }  from "./components/timer/TimerOnlyView";
import { AdminView }      from "./components/admin/AdminView";
import "./styles/globals.css";

function App() {
    const [role, setRole] = useState("");

    if (!role)               return <RoleSelect onSelect={setRole} />;
    if (role === "viewer")   return <ViewerView    onBack={() => setRole("")} />;
    if (role === "timer-only") return <TimerOnlyView onBack={() => setRole("")} />;
    if (role === "admin")    return <AdminView     onBack={() => setRole("")} />;
}

export default App;
