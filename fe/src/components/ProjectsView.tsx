import { Edit, Download, Trash2, Calendar, Users, MoreVertical, User } from "lucide-react";
import { Project } from "../types/auth";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ProjectEditView } from "./ProjectEditView";
import { useState, useCallback } from "react";

// TOC Item interface for table of contents
interface TOCItem {
  id: string;
  title: string;
  parent?: string;
  isActive?: boolean;
  number?: string;
  level?: number;
}

interface ProjectsViewProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onExportProject: (project: Project) => void;
  onEditReport: (project: Project) => void;
  onCreateProject: () => void;
  onSaveProject?: (project: Project) => void;
  editingReportProject?: Project | null;
  setEditingReportProject?: (project: Project | null) => void;
  tocItems?: TOCItem[];
  activeSection?: string;
  onTOCChange?: (tocItems: TOCItem[]) => void;
  onActiveSection?: (sectionId: string) => void;
}

export function ProjectsView({ 
  projects, 
  onEditProject, 
  onDeleteProject,
  onExportProject,
  onEditReport,
  onCreateProject,
  onSaveProject,
  editingReportProject,
  setEditingReportProject,
  tocItems = [],
  activeSection = '',
  onTOCChange,
  onActiveSection
}: ProjectsViewProps) {
  // Use local state if setEditingReportProject is not provided
  const [localEditingProject, setLocalEditingProject] = useState<Project | null>(null);
  const currentEditingProject = editingReportProject ?? localEditingProject;
  const setCurrentEditingProject = setEditingReportProject ?? setLocalEditingProject;
  
  // Handle TOC item click using global scroll function
  const handleTOCItemClick = useCallback((sectionId: string) => {
    if ((window as any).projectEditScrollToSection) {
      (window as any).projectEditScrollToSection(sectionId);
    }
  }, []);


  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Download className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-foreground">Chưa có dự án nào</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Bắt đầu bằng cách tạo dự án đầu tiên để quản lý báo cáo đánh giá an ninh mạng.
          </p>
          <Button 
            onClick={onCreateProject} 
            className="px-6 py-3 shadow-md hover:shadow-lg transition-shadow"
          >
            Tạo dự án đầu tiên
          </Button>
        </div>
      </div>
    );
  }

  // Nếu đang chỉnh sửa báo cáo, hiển thị ProjectEditView
  if (currentEditingProject) {
    return (
      <ProjectEditView
        project={currentEditingProject}
        onBack={() => setCurrentEditingProject(null)}
        onSave={(updatedProject) => {
          if (onSaveProject) {
            onSaveProject(updatedProject);
          }
          setCurrentEditingProject(null);
        }}
        onCancel={() => setCurrentEditingProject(null)}
        onTOCChange={onTOCChange}
        onActiveSection={onActiveSection}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-border card-shadow hover:card-shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-ring transition-colors break-words line-clamp-2 leading-tight" title={project.name}>
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-accent"
                    onClick={() => onEditProject(project)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                    onClick={() => onDeleteProject(project)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Tạo ngày {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{project.members} thành viên</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 font-medium hover:bg-accent transition-colors"
                onClick={() => setCurrentEditingProject(project)}
              >
                <Edit className="w-3 h-3 mr-2" />
                Chỉnh sửa
              </Button>
              <Button 
                size="sm" 
                className="flex-1 font-medium shadow-sm hover:shadow-md transition-shadow"
                onClick={() => onExportProject(project)}
              >
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
            </CardFooter>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}