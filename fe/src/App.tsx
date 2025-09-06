import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { TopBar } from './components/TopBar';
import { ProjectsView } from './components/ProjectsView';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { EditProjectDialog } from './components/EditProjectDialog';
import { ProjectEditView } from './components/ProjectEditView/index';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { api } from './services/api';
import { Project } from './types/auth';

// TOC Item interface for table of contents
interface TOCItem {
  id: string;
  title: string;
  parent?: string;
  isActive?: boolean;
  number?: string;
  level?: number;
}

function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [editingReportProject, setEditingReportProject] = useState<Project | null>(null);
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setProjects([]);
    toast.info('Đã đăng xuất khỏi hệ thống');
  };

  const sortProjectsByLatest = (projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => {
      const createdA = new Date(a.createdAt).getTime();
      const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : null;
      const representativeTimeA = (updatedA && updatedA > createdA) ? updatedA : createdA;
      const createdB = new Date(b.createdAt).getTime();
      const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : null;
      const representativeTimeB = (updatedB && updatedB > createdB) ? updatedB : createdB;
      return representativeTimeB - representativeTimeA;
    });
  };

  const loadProjects = async () => {
    if (!isAuthenticated) return;
    try {
      setProjectsLoading(true);
      const projectsData = await api.getProjects();
      const transformedProjects: Project[] = projectsData.map(p => ({
        id: p.id,
        name: p.system_name || p.project_name,
        description: '',
        status: 'active',
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || undefined,
        members: 1,
        owner: 'current_user'
      }));
      setProjects(sortProjectsByLatest(transformedProjects));
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true);
  };

  const handleProjectCreated = async (newProject: Project) => {
    setProjects(prev => sortProjectsByLatest([newProject, ...prev]));
    setIsCreateDialogOpen(false);
    toast.success(`Đã tạo dự án: ${newProject.name}`);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prev => sortProjectsByLatest(prev.map(p => p.id === updatedProject.id ? updatedProject : p)));
    setIsEditDialogOpen(false);
    setEditingProject(null);
    toast.success(`Đã cập nhật dự án: ${updatedProject.name}`);
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"?`)) {
      // Remove from local state for now
      setProjects(prev => prev.filter(p => p.id !== project.id));
      toast.success(`Đã xóa dự án: ${project.name}`);
    }
  };

  const handleExportProject = (project: Project) => {
    toast.success(`Đang xuất báo cáo cho dự án: ${project.name}`);
  };

  const handleEditReport = (project: Project) => {
    // Logic này giờ được xử lý trong ProjectsView inline
    // Không cần thay đổi currentView nữa
  };

  const handleBackFromProjectEdit = () => {
    setEditingReportProject(null);
    setCurrentView('projects');
  };

  const handleSaveProject = (updatedProject: Project) => {
    setProjects(prev => sortProjectsByLatest(prev.map(p => p.id === updatedProject.id ? updatedProject : p)));
    toast.success(`Đã cập nhật báo cáo: ${updatedProject.name}`);
  };

  // TOC related handlers
  const handleTOCChange = (newTocItems: TOCItem[]) => {
    setTocItems(newTocItems);
  };

  const handleActiveSection = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleScrollToSection = (sectionId: string) => {
    // This will be handled by the ProjectEditView component
    // We just update the active section here
    setActiveSection(sectionId);
  };



  useEffect(() => {
    if (isAuthenticated && user) loadProjects();
  }, [isAuthenticated, user]);

  if (isLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isLoading ? 'Đang tải...' : 'Đang tải dự án...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && user ? (
        <div className="h-screen bg-background overflow-hidden flex flex-col">
          <TopBar
            user={user}
            currentView={currentView}
            currentProject={editingReportProject}
            onCreateProject={handleCreateProject}
            projectsCount={projects.length}
            editingReportProject={editingReportProject}
          />
          <div className="flex-1 flex">
            <main className="flex-1 h-full">
              <Dashboard 
                user={user} 
                projects={projects}
                currentView={currentView}
                onLogout={handleLogout}
                onCreateProject={handleCreateProject}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onExportProject={handleExportProject}
                onEditReport={handleEditReport}
                onSaveProject={handleSaveProject}
                editingReportProject={editingReportProject}
                setEditingReportProject={setEditingReportProject}
                tocItems={tocItems}
                activeSection={activeSection}
                onTOCChange={handleTOCChange}
                onActiveSection={handleActiveSection}
              />
            </main>
          </div>
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} isLoading={isLoading} />
      )}
      
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
      
      <EditProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
      />
      
      <Toaster />
    </>
  );
}

export default App;