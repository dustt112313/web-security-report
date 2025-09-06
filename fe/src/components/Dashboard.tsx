import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ProjectsView } from "./ProjectsView";
import { Project, User } from "../types/auth";
import { toast } from "sonner";

// TOC Item interface for table of contents
interface TOCItem {
  id: string;
  title: string;
  parent?: string;
  isActive?: boolean;
  number?: string;
  level?: number;
}

interface DashboardProps {
  user: User;
  projects: Project[];
  currentView?: string;
  onLogout: () => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onExportProject: (project: Project) => void;
  onEditReport: (project: Project) => void;
  onSaveProject?: (project: Project) => void;
  editingReportProject?: Project | null;
  setEditingReportProject?: (project: Project | null) => void;
  tocItems?: TOCItem[];
  activeSection?: string;
  onTOCChange?: (tocItems: TOCItem[]) => void;
  onActiveSection?: (sectionId: string) => void;
}

export function Dashboard({
  user,
  projects,
  currentView: propCurrentView = "home",
  onLogout,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onExportProject,
  onEditReport,
  onSaveProject,
  editingReportProject,
  setEditingReportProject,
  tocItems = [],
  activeSection = '',
  onTOCChange,
  onActiveSection
}: DashboardProps) {
  const [currentView, setCurrentView] = useState(propCurrentView === "home" ? "projects" : propCurrentView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Handle TOC item click from Sidebar (using window global like template)
  const handleTOCItemClick = (sectionId: string) => {
    // Use the global function exposed by ProjectEditView
    if ((window as any).projectEditScrollToSection) {
      (window as any).projectEditScrollToSection(sectionId);
    }
  };

  const handleCreateProject = () => {
    toast.success("Tính năng tạo dự án sẽ được triển khai sớm!");
    onCreateProject();
  };

  const handleEditProject = (project: Project) => {
    toast.info(`Chỉnh sửa dự án: ${project.name}`);
    onEditProject(project);
  };

  const handleDeleteProject = (project: Project) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"?`)) {
      toast.success(`Đã xóa dự án: ${project.name}`);
      onDeleteProject(project);
    }
  };

  const handleExportProject = (project: Project) => {
    toast.success(`Đang xuất báo cáo cho dự án: ${project.name}`);
    onExportProject(project);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case "projects":
        return "Dự án";
      case "reports":
        return "Báo cáo";
      case "settings":
        return "Cài đặt";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        editingReportProject={editingReportProject}
        tocItems={tocItems}
        activeSection={activeSection}
        onTOCItemClick={handleTOCItemClick}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 h-full">
          {(currentView === "projects" || propCurrentView === "projects") && (
            <ProjectsView
              projects={projects}
              onCreateProject={handleCreateProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onExportProject={handleExportProject}
              onEditReport={onEditReport}
              onSaveProject={onSaveProject}
              editingReportProject={editingReportProject}
              setEditingReportProject={setEditingReportProject}
              tocItems={tocItems}
              activeSection={activeSection}
              onTOCChange={onTOCChange}
              onActiveSection={onActiveSection}
            />
          )}
          {currentView === "reports" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Báo cáo</h3>
                <p className="text-muted-foreground">
                  Tính năng báo cáo sẽ được triển khai sớm.
                </p>
              </div>
            </div>
          )}
          {currentView === "settings" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Cài đặt</h3>
                <p className="text-muted-foreground">
                  Tính năng cài đặt sẽ được triển khai sớm.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}