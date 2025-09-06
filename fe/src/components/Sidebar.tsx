import { Home, FolderOpen, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/auth";
import { Separator } from "./ui/separator";

interface TOCItem {
  id: string;
  title: string;
  parent?: string;
  isActive?: boolean;
  number?: string;
  level?: number;
}

interface SidebarProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  editingReportProject?: any;
  tocItems?: TOCItem[];
  activeSection?: string;
  onTOCItemClick?: (itemId: string) => void;
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to process TOC items with numbering
const processTOCItems = (items: TOCItem[]): Array<TOCItem & { displayTitle: string; level: number }> => {
  return items.map(item => {
    const level = item.level ?? 0;
    const number = item.number || '';
    const title = capitalizeFirstLetter(item.title);
    
    let displayTitle = '';
    if (level === 0) {
      // Main sections with Roman numerals
      displayTitle = number ? `${number}. ${title}` : title;
    } else if (level === 1) {
      // Level 1 subsections with Arabic numerals
      displayTitle = number ? `${number}. ${title}` : title;
    } else if (level === 2) {
      // Level 2 subsections with decimal numbering
      displayTitle = number ? `${number}. ${title}` : title;
    } else {
      displayTitle = title;
    }
    
    return {
      ...item,
      displayTitle,
      level
    };
  });
};

export function Sidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  editingReportProject,
  tocItems = [],
  activeSection = '',
  onTOCItemClick
}: SidebarProps) {
  const navigationItems = [
    {
      id: "projects",
      label: "Dự án",
      icon: FolderOpen,
      view: "projects"
    },
  ];

  const processedTocItems = processTOCItems(tocItems);

  return (
    <div className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border relative z-40">
      <div className="flex-1 overflow-x-hidden overflow-y-auto min-h-0 pb-28">
        {/* Logo Header */}
        <div className="px-4 py-4 border-b border-sidebar-border h-[60px] flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              Report Manager
            </h1>
            <p className="text-xs text-sidebar-foreground/60 font-medium">Security Reports</p>
          </div>
        </div>
      </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3 h-[60px] flex flex-col justify-center">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1",
                  isActive
                    ? "bg-sidebar-primary !text-white shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {editingReportProject && processedTocItems.length > 0 && (
          <>
            <Separator className="mx-3" />
            <div className="p-3 flex-1 min-h-0 flex flex-col">
              <h3 className="px-3 py-2 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider flex-shrink-0">
                Mục lục
              </h3>
              <div className="space-y-1 overflow-y-auto overflow-x-hidden flex-1 min-h-0 w-full">
                {processedTocItems.map((item) => {
                  const isMainSection = item.level === 0;
                  const isLevel1 = item.level === 1;
                  const isLevel2 = item.level === 2;
                  const isActive = activeSection === item.id || item.isActive;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTOCItemClick?.(item.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1",
                        isMainSection && "font-semibold",
                        isLevel1 && "font-semibold pl-6",
                        isLevel2 && "font-semibold pl-9",
                        isActive
                          ? "bg-sidebar-primary !text-white shadow-sm"
                          : cn(
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isLevel2 
                                ? "text-sidebar-foreground/50" 
                                : "text-sidebar-foreground/60"
                            )
                      )}
                    >
                      <span className="block truncate">{capitalizeFirstLetter(item.displayTitle)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-sidebar p-3 flex flex-col z-10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-sidebar-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>
      </div>
    </div>
  );
}