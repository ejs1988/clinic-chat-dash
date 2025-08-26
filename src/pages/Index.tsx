import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AppointmentSystem } from "@/components/dashboard/AppointmentSystem";
import { PatientsManagement } from "@/components/dashboard/PatientsManagement";
import { LiveChat } from "@/components/dashboard/LiveChat";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <DashboardOverview />;
      case "appointments":
        return <AppointmentSystem />;
      case "chat":
        return <LiveChat />;
      case "patients":
        return <PatientsManagement />;
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Configurações</h2>
            <p className="text-muted-foreground">Painel de configurações em desenvolvimento</p>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
