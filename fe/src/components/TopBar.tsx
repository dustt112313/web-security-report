import { Plus, Search } from "lucide-react";
import { User, Project } from "@/types/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TopBarProps {
  user: User;
  currentView: string;
  currentProject?: Project | null;
  onCreateProject: () => void;
  projectsCount?: number;
  editingReportProject?: Project | null;
}

export function TopBar({
  currentView,
  currentProject,
  onCreateProject,
  projectsCount = 0,
  editingReportProject
}: TopBarProps) {
  const getPageTitle = () => {
    if (editingReportProject) {
      return `Báo cáo dự án ${editingReportProject.name}`;
    }
    switch (currentView) {
      case "home":
        return "Report Manager";
      case "projects":
        return "Projects";
      case "project-edit":
        return currentProject ? `Báo cáo dự án ${currentProject.name}` : "Edit Project";
      default:
        return "Project Manager";
    }
  };

  return (
    <>
      {/* Luôn hiển thị TopBar khi ở trang projects */}
      {currentView === 'projects' && (
        <div className="border-r border-sidebar-border">
          <div className="bg-sidebar h-[60px] px-4 py-3 sticky top-0 z-50 border-b border-sidebar-border border-r border-sidebar-border" />
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/60 border-r border-sidebar-border sticky top-0 z-50 px-4 py-3 h-[60px]">
            <div className="flex items-center justify-between gap-4">
              {/* Hiển thị tiêu đề khi đang edit project */}
              {editingReportProject ? (
                <div className="flex items-center gap-3 flex-1">
                  <h1 className="text-lg font-semibold text-foreground">
                    {getPageTitle()}
                  </h1>
                </div>
              ) : (
                <>
                  {/* Search and Filter Section - chỉ hiển thị khi không edit */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Tìm kiếm project..."
                        className="w-full pl-10 pr-4 py-2 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <select className="px-3 py-2 border border-border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="all">Tất cả trạng thái</option>
                      <option value="active">Đang hoạt động</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="archived">Đã lưu trữ</option>
                    </select>
                  </div>

                  {/* Create Project Button - chỉ hiển thị khi không edit */}
                  <button
                    onClick={onCreateProject}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo Project Mới
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>  
  );
};