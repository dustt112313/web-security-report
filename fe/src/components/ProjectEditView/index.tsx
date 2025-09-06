import React, { useState, useRef, useEffect, useMemo } from "react";
import { Save, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Project } from "../../types/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { api, ProjectAllDataResponse } from '../../services/api';

// Import types
import {
  ProjectEditViewProps,
  AssessmentTarget,
  AssessmentScope,
  ApplicationInfoRow,
  TOCItem,
  Vulnerability,
  VulnerabilityImage,
  AssessmentResult
} from "./types";

// Import utilities
import { toRoman } from "./utils";

// Import section components
import { AssessmentTargetSection } from "./components/AssessmentTargetSection";
import { AssessmentScopeSection } from "./components/AssessmentScopeSection";
import { ApplicationInfoSection } from "./components/ApplicationInfoSection";
import { AssessmentResultsSection } from "./components/AssessmentResultsSection";

// Main component
export function ProjectEditView({ 
  project, 
  onBack, 
  onSave, 
  onCancel, 
  onTOCChange,
  onActiveSection
}: ProjectEditViewProps) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("general-info");
  const [systemName, setSystemName] = useState("");
  const [assessmentTargets, setAssessmentTargets] = useState<AssessmentTarget[]>([]);
  const [assessmentScopes, setAssessmentScopes] = useState<AssessmentScope[]>([]);
  const [applicationInfoRows, setApplicationInfoRows] = useState<ApplicationInfoRow[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [editingVuln, setEditingVuln] = useState<string | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  
  // Section collapse states
  const [isSection1Collapsed, setIsSection1Collapsed] = useState(false);
  const [isSection2Collapsed, setIsSection2Collapsed] = useState(false);
  
  // Refs for scrolling
  const generalInfoRef = useRef<HTMLDivElement>(null);
  const systemNameRef = useRef<HTMLDivElement>(null);
  const targetAssessmentRef = useRef<HTMLDivElement>(null);
  const detailedResultsRef = useRef<HTMLDivElement>(null);
  const appAssessmentRef = useRef<HTMLDivElement>(null);
  const sourceCodeAssessmentRef = useRef<HTMLDivElement>(null);
  
  // Dynamic refs for targets
  const appTargetRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});
  const sourceCodeTargetRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});

  // Separate targets by type for TOC
  const appTargets = useMemo(() => {
    return assessmentTargets.filter(target => 
      !target.label.toLowerCase().includes('mã nguồn') && 
      !target.label.toLowerCase().includes('source code')
    );
  }, [assessmentTargets]);

  const sourceCodeTargets = useMemo(() => {
    return assessmentTargets.filter(target => 
      target.label.toLowerCase().includes('mã nguồn') || 
      target.label.toLowerCase().includes('source code')
    );
  }, [assessmentTargets]);

  // Generate TOC items
  const tocItems = useMemo((): TOCItem[] => {
    const items: TOCItem[] = [
      {
        id: "general-info",
        title: "I. Thông tin chung",
        isActive: activeSection === "general-info",
        number: "I",
        level: 1
      },
      {
        id: "system-name",
        title: "1. Đối tượng được kiểm tra đánh giá",
        parent: "general-info",
        isActive: activeSection === "system-name",
        number: "1",
        level: 2
      },
      {
        id: "target-assessment",
        title: "2. Đối tượng đánh giá",
        parent: "general-info",
        isActive: activeSection === "target-assessment",
        number: "2",
        level: 2
      },
      {
        id: "detailed-results",
        title: "II. Kết quả đánh giá chi tiết",
        isActive: activeSection === "detailed-results",
        number: "II",
        level: 1
      }
    ];

    // Add app assessment section if there are app targets
    if (appTargets.length > 0) {
      items.push({
        id: "app-assessment",
        title: "1. Đánh giá ứng dụng",
        parent: "detailed-results",
        isActive: activeSection === "app-assessment",
        number: "1",
        level: 2
      });
      
      // Add individual app targets
      appTargets.forEach((target, index) => {
        items.push({
          id: `app-${target.id}`,
          title: `${index + 1}.${index + 1}. ${target.label}`,
          parent: "app-assessment",
          isActive: activeSection === `app-${target.id}`,
          number: `${index + 1}.${index + 1}`,
          level: 3
        });
      });
    }

    // Add source code assessment section if there are source code targets
    if (sourceCodeTargets.length > 0) {
      const sectionNumber = appTargets.length > 0 ? "2" : "1";
      items.push({
        id: "source-code-assessment",
        title: `${sectionNumber}. Đánh giá mã nguồn`,
        parent: "detailed-results",
        isActive: activeSection === "source-code-assessment",
        number: sectionNumber,
        level: 2
      });
      
      // Add individual source code targets
      sourceCodeTargets.forEach((target, index) => {
        items.push({
          id: `source-${target.id}`,
          title: `${sectionNumber}.${index + 1}. ${target.label}`,
          parent: "source-code-assessment",
          isActive: activeSection === `source-${target.id}`,
          number: `${sectionNumber}.${index + 1}`,
          level: 3
        });
      });
    }

    return items;
  }, [appTargets, sourceCodeTargets, activeSection]);

  // Handle system name update on blur
  const handleSystemNameUpdate = async () => {
    try {
      await api.updateProject(project.id, { 
        project_name: project.name, // Required field
        system_name: systemName 
      });
      toast.success('Cập nhật tên hệ thống thành công');
    } catch (err) {
      console.error('Error updating system name:', err);
      toast.error('Không thể cập nhật tên hệ thống');
    }
  };

  // State to track previous project ID to prevent duplicate API calls
  const [previousProjectId, setPreviousProjectId] = useState<number | null>(null);
  
  // State to track mapping between temporary IDs and backend target info for CRUD operations
  const [targetBackendMapping, setTargetBackendMapping] = useState<{[tempId: string]: {id: number, name: string}}>({});
  
  // State to track mapping between temporary IDs and backend scope info for CRUD operations
  const [scopeBackendMapping, setScopeBackendMapping] = useState<{[tempId: string]: {id: number, object: string, info: string}}>({});
  
  // State to track mapping between temporary IDs and backend application info for CRUD operations
  const [applicationInfoBackendMapping, setApplicationInfoBackendMapping] = useState<{[tempId: string]: {id: number, information: string}}>({});
  
  // Load project data from API when project.id changes
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setIsDataLoading(true);
        setError(null);
        
        const response: ProjectAllDataResponse = await api.getProjectAllData(project.id);
        
        // Map API response to component state
        setSystemName(response.project_name || "");
        
        // Use targets data directly from all-data response (no additional API call)
        if (response.targets && response.targets.length > 0) {
          // Map response.targets using real backend IDs
          const mappedTargets = response.targets.map((target) => {
            return {
              id: target.id.toString(), // Use real backend ID as string
              label: target.name,
              description: ""
            };
          });
          
          setAssessmentTargets(mappedTargets);
          
          // Initialize backend mapping with real IDs from response
          const initialMapping: { [key: string]: { id: number; name: string } } = {};
          response.targets.forEach((target) => {
            initialMapping[target.id.toString()] = {
              id: target.id,
              name: target.name
            };
          });
          setTargetBackendMapping(initialMapping);
          
          // Load bugs for each target after targets are successfully loaded
          await loadAllAssessmentResults(mappedTargets);
        } else {
          // Initialize empty array when no targets exist
          setAssessmentTargets([]);
          setTargetBackendMapping({});
          setAssessmentResults([]); // Clear assessment results when no targets
        }
        
        // Map scope array to AssessmentScope objects
        if (response.scope && response.scope.length > 0) {
          const mappedScopes = response.scope.map((scope) => ({
            id: scope.id.toString(), // Use real backend ID as string
            label: scope.object,
            description: scope.info
          }));
          setAssessmentScopes(mappedScopes);
          
          // Create scope backend mapping for deletion
          const scopeMapping: { [key: string]: { id: number; object: string; info: string } } = {};
          response.scope.forEach((scope) => {
            scopeMapping[scope.id.toString()] = {
              id: scope.id,
              object: scope.object,
              info: scope.info
            };
          });
          setScopeBackendMapping(scopeMapping);
        } else {
          // Initialize empty array when no scopes exist
          setAssessmentScopes([]);
          setScopeBackendMapping({});
        }
        
        // Map collected_information array to ApplicationInfoRow objects
        if (response.collected_information && response.collected_information.length > 0) {
          const mappedAppInfo = response.collected_information.map((info) => ({
            id: info.id.toString(), // Use real backend ID as string
            info: info.information, // Map backend 'information' field to frontend 'info' field
            content: ""
          }));
          setApplicationInfoRows(mappedAppInfo);
          
          // Create application info backend mapping
          const appInfoMapping: { [key: string]: { id: number; information: string } } = {};
          response.collected_information.forEach((info) => {
            appInfoMapping[info.id.toString()] = {
              id: info.id,
              information: info.information
            };
          });
          setApplicationInfoBackendMapping(appInfoMapping);
        } else {
          // Initialize empty array when no application info exists
          setApplicationInfoRows([]);
          setApplicationInfoBackendMapping({});
        }
        
        // Map ungdung vulnerabilities to AssessmentResult objects
        if (response.list_report?.ungdung && response.list_report.ungdung.length > 0) {
          const mappedResults = response.list_report.ungdung.map((vuln, index) => {
            // Ensure severity matches the expected type
            const validSeverities = ["Thấp", "Trung Bình", "Cao", "Nghiêm Trọng"] as const;
            const severity = validSeverities.includes(vuln.severity as any) ? vuln.severity as any : "Thấp";
            
            return {
              id: `result_${index + 1}`,
              name: vuln.name || "Lỗ hổng không xác định",
              severity,
              description: vuln.description || "",
              recommendation: vuln.recommendation || ""
            };
          });
          setAssessmentResults(mappedResults);
        }
        
        // Update previous project ID after successful load
        setPreviousProjectId(project.id);
        
      } catch (err) {
        console.error('Error loading project data:', err);
        setError('Không thể tải dữ liệu dự án. Vui lòng thử lại.');
        toast.error('Không thể tải dữ liệu dự án');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    // Only call API if project.id exists and is different from previous
    if (project?.id && project.id !== previousProjectId) {
      loadProjectData();
    }
  }, [project.id, previousProjectId]);

  // Update TOC when activeSection changes
  useEffect(() => {
    onTOCChange?.(tocItems);
    onActiveSection?.(activeSection);
  }, [tocItems, activeSection, onTOCChange, onActiveSection]);

  // Create ref for the main scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const refs: { [key: string]: React.RefObject<HTMLDivElement> } = {
      "general-info": generalInfoRef,
      "system-name": systemNameRef,
      "target-assessment": targetAssessmentRef,

      "detailed-results": detailedResultsRef,
      "app-assessment": appAssessmentRef,
      "web-assessment": appAssessmentRef, // Reuse app assessment ref for web assessment
      "source-code-assessment": sourceCodeAssessmentRef,
      "source-app-assessment": sourceCodeAssessmentRef // Reuse source code assessment ref
    };
    
    appTargets.forEach(target => {
      refs[`app-${target.id}`] = appTargetRefs.current[target.id];
    });
    sourceCodeTargets.forEach(target => {
      refs[`source-${target.id}`] = sourceCodeTargetRefs.current[target.id];
    });

    const ref = refs[sectionId];
    const container = scrollContainerRef.current;
    
    if (ref?.current && container) {
      const element = ref.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate the scroll position relative to the container
      const scrollTop = container.scrollTop;
      const targetScrollTop = scrollTop + elementRect.top - containerRect.top - 20; // 20px offset for better visibility
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Expose scrollToSection to parent component via window global (like template)
  useEffect(() => {
    (window as any).projectEditScrollToSection = scrollToSection;
    return () => {
      delete (window as any).projectEditScrollToSection;
    };
  }, [appTargets, sourceCodeTargets]);

  // Assessment target functions
  const addAssessmentTarget = (target: Omit<AssessmentTarget, 'id'>) => {
    const tempId = `target_temp_${Date.now()}`;
    
    // Only add to local state, don't send API yet
    const newTarget = {
      ...target,
      id: tempId
    };
    setAssessmentTargets(prev => [...prev, newTarget]);
  };

  const saveAssessmentTarget = async (id: string, targetName: string) => {
    if (!project?.id || !targetName.trim()) return;
    
    try {
      console.log('💾 Debug saveAssessmentTarget:');
      console.log('Target ID:', id);
      console.log('Target Name:', targetName);
      console.log('Current Backend Mapping:', targetBackendMapping);
      
      // Check if target already exists in backend
      const targetInfo = targetBackendMapping[id];
      
      if (targetInfo) {
        console.log('🔄 Updating existing target with backend ID:', targetInfo.id);
        // Update existing target
        await api.updateAssessmentTarget(targetInfo.id, targetName);
        console.log('✅ Update API call successful');
        // Update mapping with new name
        setTargetBackendMapping(prev => ({
          ...prev,
          [id]: {
            ...targetInfo,
            name: targetName
          }
        }));
      } else {
        console.log('🆕 Creating new target');
        // Create new target
        const createdTarget = await api.createAssessmentTarget(project.id, targetName);
        console.log('✅ Create API call successful, backend ID:', createdTarget.id);
        // Update mapping with backend ID
        setTargetBackendMapping(prev => {
          const newMapping = {
            ...prev,
            [id]: {
              id: createdTarget.id,
              name: createdTarget.target_name
            }
          };
          console.log('🗺️ Updated backend mapping:', newMapping);
          return newMapping;
        });
      }
      
      // Update local state to reflect the saved value
      setAssessmentTargets(prev => 
        prev.map(target => 
          target.id === id ? { ...target, label: targetName } : target
        )
      );
    } catch (error) {
      console.error('❌ Error saving assessment target:', error);
      toast.error('Không thể lưu đối tượng đánh giá');
    }
  };

  const removeUnsavedTarget = (id: string) => {
    // Remove target that hasn't been saved to backend
    setAssessmentTargets(prev => prev.filter(target => target.id !== id));
  };

  const removeAssessmentTarget = async (id: string) => {
    try {
      // Debug: Check target backend mapping
      console.log('🔍 Debug removeAssessmentTarget:');
      console.log('Target ID:', id);
      console.log('Target Backend Mapping:', targetBackendMapping);
      console.log('Target exists in mapping:', !!targetBackendMapping[id]);
      
      // Check if target has backend mapping (already saved to backend)
      const targetInfo = targetBackendMapping[id];
      
      if (targetInfo) {
        console.log('📡 Calling API to delete target with backend ID:', targetInfo.id);
        // Target exists in backend, call API to delete
        await api.deleteAssessmentTarget(targetInfo.id);
        console.log('✅ API call successful');
        
        // Remove from backend mapping
        setTargetBackendMapping(prev => {
          const newMapping = { ...prev };
          delete newMapping[id];
          return newMapping;
        });
        
        toast.success('Đối tượng đánh giá đã được xóa thành công');
      } else {
        console.log('🏠 Target not in backend mapping - only removing from local state');
      }
      // If no backend mapping, it's a new target that hasn't been saved yet
      // Just remove from local state (no API call needed)
      
      // Always update local state to remove target from UI
      console.log('🔄 Updating local state to remove target from UI');
      setAssessmentTargets(prev => prev.filter(target => target.id !== id));
      setVulnerabilities(prev => prev.filter(vuln => vuln.targetId !== id));
      
    } catch (err) {
      console.error('❌ Error removing target:', err);
      toast.error('Không thể xóa đối tượng đánh giá');
    }
  };

  const updateAssessmentTarget = (id: string, field: keyof AssessmentTarget, value: any) => {
    // Only update local state, don't call API
    setAssessmentTargets(prev => 
      prev.map(target => 
        target.id === id ? { ...target, [field]: value } : target
      )
    );
  };

  // Note: Individual CRUD operations now handle backend sync automatically

  // Assessment scope functions
  const addAssessmentScope = () => {
    console.log('🔵 [DEBUG] Adding new assessment scope');
    const timestamp = Date.now();
    const newScope: AssessmentScope = {
      id: `scope_${timestamp}`,
      label: "",
      description: ""
    };
    console.log('🔵 [DEBUG] New scope object:', newScope);
    console.log('🔵 [DEBUG] Current assessment scope before adding:', assessmentScopes);
    setAssessmentScopes(prev => {
      const updated = [...prev, newScope];
      console.log('🔵 [DEBUG] Assessment scope after adding:', updated);
      return updated;
    });
  };

  const removeAssessmentScope = async (id: string) => {
    console.log('🗑️ [DEBUG] Removing scope with ID:', id, 'Type:', typeof id);
    console.log('📋 [DEBUG] Current scopeBackendMapping:', JSON.stringify(scopeBackendMapping, null, 2));
    
    const backendData = scopeBackendMapping[id];
    console.log('🔍 [DEBUG] Backend data for scope:', JSON.stringify(backendData, null, 2));
    
    if (backendData && typeof backendData === 'object' && 'id' in backendData) {
      const backendId = backendData.id;
      console.log('🌐 [DEBUG] Calling API to delete scope with backend ID:', backendId, 'Type:', typeof backendId);
      
      // Validate backend ID
      if (backendId === null || backendId === undefined || isNaN(Number(backendId))) {
        console.error('❌ [DEBUG] Invalid backend ID detected:', backendId);
        return;
      }
      
      try {
        await api.deleteAssessmentScope(backendId);
        console.log('✅ [DEBUG] Successfully deleted scope from backend');
        
        // Remove from backend mapping
        setScopeBackendMapping(prev => {
          const newMapping = { ...prev };
          delete newMapping[id];
          console.log('📋 [DEBUG] Updated scopeBackendMapping after deletion:', JSON.stringify(newMapping, null, 2));
          return newMapping;
        });
      } catch (error) {
        console.error('❌ [DEBUG] Error deleting scope from backend:', error);
        return; // Don't remove from local state if backend deletion failed
      }
    } else {
      console.log('ℹ️ [DEBUG] Scope not found in backend mapping, removing from local state only');
    }
    
    // Remove from local state
    setAssessmentScopes(prev => {
      const updated = prev.filter(scope => scope.id !== id);
      console.log('📝 [DEBUG] Updated local assessment scopes:', updated.length, 'items');
      return updated;
    });
  };

  const updateAssessmentScope = (id: string, field: keyof AssessmentScope, value: any, shouldCallAPI: boolean = false) => {
    console.log('🔄 [DEBUG] ===== UPDATE ASSESSMENT SCOPE START =====');
    console.log('🔄 [DEBUG] Scope ID:', id, 'Type:', typeof id);
    console.log('🔄 [DEBUG] Field:', field, 'Value:', value, 'Should call API:', shouldCallAPI);
    console.log('🔄 [DEBUG] Current scopeBackendMapping:', JSON.stringify(scopeBackendMapping, null, 2));
    
    // Check if scope exists in backend mapping
    const backendData = scopeBackendMapping[id];
    if (backendData) {
      console.log('🔄 [DEBUG] Found backend data for scope:', JSON.stringify(backendData, null, 2));
      console.log('🔄 [DEBUG] Backend ID:', backendData.id, 'Type:', typeof backendData.id);
    } else {
      console.log('🔄 [DEBUG] No backend data found for scope ID:', id);
    }
    
    // Always update local state first
    setAssessmentScopes(prev => {
      const updated = prev.map(scope => 
        scope.id === id ? { ...scope, [field]: value } : scope
      );
      console.log('📝 [DEBUG] Updated local scope in state');
      return updated;
    });
    
    // Call API only when shouldCallAPI is true (onBlur)
    if (shouldCallAPI) {
      console.log('💾 [DEBUG] Triggering save for scope:', id);
      console.log('🔄 [DEBUG] ===== UPDATE ASSESSMENT SCOPE END =====');
      saveAssessmentScope(id, field, value);
    } else {
      console.log('🔄 [DEBUG] ===== UPDATE ASSESSMENT SCOPE END (No API call) =====');
    }
  };

  const saveAssessmentScope = async (id: string, field?: keyof AssessmentScope, value?: any) => {
    const scope = assessmentScopes.find(s => s.id === id);
    if (!scope) return;

    // If field and value are provided, update the scope first
    let updatedScope = scope;
    if (field && value !== undefined) {
      updatedScope = { ...scope, [field]: value };
    }

    console.log('💾 [DEBUG] Starting saveAssessmentScope for scope:', updatedScope);
    console.log('💾 [DEBUG] Current scopeBackendMapping:', scopeBackendMapping);
    console.log('💾 [DEBUG] Checking if scope exists in backend mapping:', scopeBackendMapping[id]);
    
    const backendData = scopeBackendMapping[id];
    console.log('🔍 [DEBUG] Backend data for scope:', JSON.stringify(backendData, null, 2));

    try {
      if (scopeBackendMapping[id]) {
        // Update existing scope
        const backendData = scopeBackendMapping[id];
        const backendId = Number(backendData.id);
        
        console.log('🔄 [DEBUG] Updating existing scope with backend ID:', backendData.id, 'Converted to number:', backendId);
        console.log('🔄 [DEBUG] Scope data being sent:', { doituong: updatedScope.label, thongtin: updatedScope.description });
        
        // Validate backend ID before API call
        if (isNaN(backendId) || backendId <= 0) {
          console.error('❌ [ERROR] Invalid backend ID for update:', backendData.id);
          toast.error('Lỗi: ID không hợp lệ');
          return;
        }
        
        const response = await api.updateAssessmentScope(
          backendId,
          project.id,
          updatedScope.label,
          updatedScope.description
        );
        console.log('✅ [DEBUG] Update response:', JSON.stringify(response, null, 2));
        
        // Update backend mapping with new data
        setScopeBackendMapping(prev => {
          const newMapping = {
            ...prev,
            [id]: {
              id: response.id,
              object: updatedScope.label,
              info: updatedScope.description
            }
          };
          console.log('📋 [DEBUG] Updated scopeBackendMapping after update:', JSON.stringify(newMapping, null, 2));
          return newMapping;
        });
      } else {
        // Create new scope
        console.log('➕ [DEBUG] Creating new scope for project:', project?.id);
        console.log('➕ [DEBUG] Scope data being sent:', { doituong: updatedScope.label, thongtin: updatedScope.description });
        console.log('➕ [DEBUG] API endpoint will be called: /scope');
        
        if (!project?.id) {
          console.error('No project ID available');
          return;
        }
        
        const response = await api.createAssessmentScope(
          project.id,
          updatedScope.label,
          updatedScope.description
        );
        
        console.log('✅ [DEBUG] Create response:', JSON.stringify(response, null, 2));
        
        // Add to backend mapping
        if (response && response.id) {
          console.log('🔗 [DEBUG] Updating scope backend mapping with new ID:', response.id);
          setScopeBackendMapping(prev => {
            const newMapping = {
              ...prev,
              [id]: {
                id: response.id,
                object: updatedScope.label,
                info: updatedScope.description
              }
            };
            console.log('🔗 [DEBUG] New scope backend mapping:', newMapping);
            return newMapping;
          });
        } else {
          console.warn('⚠️ [WARNING] No ID returned from create scope API');
        }
      }
    } catch (error) {
      console.error('❌ [ERROR] Failed to save assessment scope:', error);
      console.error('❌ [ERROR] Error details:', {
        message: error.message,
        stack: error.stack,
        scope: updatedScope,
        projectId: project?.id
      });
      toast.error('Không thể lưu phạm vi kiểm tra');
    }
  };



  // Application info functions
  const addApplicationInfoRow = () => {
    const tempId = `app_info_temp_${Date.now()}`;
    const newRow: ApplicationInfoRow = {
      id: tempId,
      info: "",
      content: ""
    };
    setApplicationInfoRows(prev => [...prev, newRow]);
  };

  const removeApplicationInfoRow = async (id: string) => {
    try {
      console.log('🔍 Debug removeApplicationInfoRow:');
      console.log('Application Info ID:', id);
      console.log('Application Info Backend Mapping:', applicationInfoBackendMapping);
      
      // Check if application info has backend mapping (already saved to backend)
      const appInfoData = applicationInfoBackendMapping[id];
      
      if (appInfoData) {
        console.log('📡 Calling API to delete application info with backend ID:', appInfoData.id);
        // Application info exists in backend, call API to delete
        await api.deleteCollectedInformation(appInfoData.id);
        console.log('✅ API call successful');
        
        // Remove from backend mapping
        setApplicationInfoBackendMapping(prev => {
          const newMapping = { ...prev };
          delete newMapping[id];
          return newMapping;
        });
        
        toast.success('Thông tin ứng dụng đã được xóa thành công');
      } else {
        console.log('🏠 Application info not in backend mapping - only removing from local state');
      }
      
      // Remove from local state
      setApplicationInfoRows(prev => prev.filter(row => row.id !== id));
    } catch (error) {
      console.error('❌ Error removing application info:', error);
      toast.error('Không thể xóa thông tin ứng dụng');
    }
  };

  const updateApplicationInfoRow = (id: string, info: string, shouldCallAPI: boolean = false) => {
    // Update local state immediately
    setApplicationInfoRows(prev => 
      prev.map(row => 
        row.id === id ? { ...row, info: info } : row
      )
    );
    
    // Call API if shouldCallAPI is true (from onBlur)
    if (shouldCallAPI) {
      saveApplicationInfoRow(id, info);
    }
  };
  
  const saveApplicationInfoRow = async (id: string, information: string) => {
    if (!project?.id || !information.trim()) return;
    
    try {
      console.log('💾 Debug saveApplicationInfoRow:');
      console.log('Application Info ID:', id);
      console.log('Information:', information);
      console.log('Current Backend Mapping:', applicationInfoBackendMapping);
      
      // Check if application info already exists in backend
      const appInfoData = applicationInfoBackendMapping[id];
      
      if (appInfoData) {
        console.log('🔄 Updating existing application info with backend ID:', appInfoData.id);
        // Update existing application info
        await api.updateCollectedInformation(appInfoData.id, project.id, information);
        console.log('✅ Update API call successful');
        
        // Update mapping with new information
        setApplicationInfoBackendMapping(prev => ({
          ...prev,
          [id]: {
            ...appInfoData,
            information: information
          }
        }));
      } else {
        console.log('🆕 Creating new application info');
        // Create new application info
        const createdInfo = await api.createCollectedInformation(project.id, information);
        console.log('✅ Create API call successful, backend ID:', createdInfo.id);
        
        // Update mapping with backend ID
        setApplicationInfoBackendMapping(prev => {
          const newMapping = {
            ...prev,
            [id]: {
              id: createdInfo.id,
              information: createdInfo.information
            }
          };
          console.log('🗺️ Updated application info backend mapping:', newMapping);
          return newMapping;
        });
      }
      
      // Update local state to reflect the saved value
      setApplicationInfoRows(prev => 
        prev.map(row => 
          row.id === id ? { ...row, info: information } : row
        )
      );
    } catch (error) {
      console.error('❌ Error saving application info:', error);
      toast.error('Không thể lưu thông tin ứng dụng');
    }
  };

  // Vulnerability management functions
  const addVulnerability = (targetId: string) => {
    setEditingVuln(null);
    
    const newVuln: Vulnerability = {
      id: `vuln_${Date.now()}`,
      name: "",
      severity: "Trung Bình", 
      description: "",
      impact: "",
      recommendation: "",
      images: [],
      targetId
    };
    
    setVulnerabilities(prev => [...prev, newVuln]);
    setEditingVuln(newVuln.id);
  };

  const updateVulnerability = (id: string, field: keyof Vulnerability, value: any) => {
    setVulnerabilities(prev => 
      prev.map(vuln => 
        vuln.id === id ? { ...vuln, [field]: value } : vuln
      )
    );
  };

  const removeVulnerability = (id: string) => {
    setVulnerabilities(prev => prev.filter(vuln => vuln.id !== id));
    if (editingVuln === id) {
      setEditingVuln(null);
    }
  };

  const saveVulnerability = () => {
    setEditingVuln(null);
    toast.success("Lỗ hổng đã được lưu thành công!");
  };

  const cancelVulnerabilityEdit = () => {
    if (editingVuln) {
      const vulnerability = vulnerabilities.find(v => v.id === editingVuln);
      
      if (vulnerability && !vulnerability.name?.trim() && !vulnerability.description?.trim() && 
          (vulnerability.images.length === 0 || (!vulnerability.images[0]?.url && !vulnerability.images[0]?.description))) {
        removeVulnerability(editingVuln);
      }
    }
    
    setEditingVuln(null);
  };

  const editVulnerability = (vulnId: string) => {
    setEditingVuln(vulnId);
  };

  const updateVulnerabilityImage = (vulnId: string, imageIndex: number, field: keyof VulnerabilityImage, value: any) => {
    setVulnerabilities(prev =>
      prev.map(vuln =>
        vuln.id === vulnId
          ? {
              ...vuln,
              images: vuln.images.map((img, index) =>
                index === imageIndex ? { ...img, [field]: value } : img
              )
            }
          : vuln
      )
    );
  };

  const removeVulnerabilityImage = (vulnId: string, imageIndex: number) => {
    setVulnerabilities(prev =>
      prev.map(vuln =>
        vuln.id === vulnId
          ? { ...vuln, images: vuln.images.filter((_, index) => index !== imageIndex) }
          : vuln
      )
    );
  };

  const getVulnerabilitiesForTarget = (targetId: string): Vulnerability[] => {
    return vulnerabilities.filter(vuln => vuln.targetId === targetId);
  };

  // Assessment results functions
  const addAssessmentResult = (result?: AssessmentResult, targetId?: number, targetName?: string) => {
    if (result) {
      setAssessmentResults(prev => [...prev, result]);
    } else {
      // Xác định bug_type dựa trên targetName
      const bugType = targetName && targetName.includes('Mã nguồn') ? 'manguon' : 'ungdung';
      
      const newResult: AssessmentResult = {
        id: `temp_${Date.now()}`,
        name: "",
        severity: "Trung Bình",
        description: "",
        recommendation: "",
        target_id: targetId, // Set target_id for new results
        bug_type: bugType // Set bug_type based on target name
      };
      setAssessmentResults(prev => [...prev, newResult]);
    }
  };

  // Load assessment results from API for all targets
  const loadAllAssessmentResults = async (targets: AssessmentTarget[]) => {
    try {
      const allResults: AssessmentResult[] = [];
      
      // Load results for all targets
      for (const target of targets) {
        const targetId = parseInt(target.id);
        if (!isNaN(targetId)) {
          const bugs = await api.getBugsByTarget(targetId);
          const results = bugs.map(bug => ({
            id: bug.id.toString(),
            name: bug.vulnerability_heading,
            severity: bug.severity_text as 'Thấp' | 'Trung Bình' | 'Cao' | 'Nghiêm Trọng',
            description: bug.description || '',
            recommendation: bug.recommendation_content || '',
            affected_objects: bug.affected_objects || [],
            evidence_images: [],
            target_id: bug.target_id,
            bug_type: bug.bug_type,
            created_at: bug.created_at,
            updated_at: bug.updated_at
          }));
          allResults.push(...results);
        }
      }
      
      console.log('Loaded all assessment results:', allResults);
      setAssessmentResults(allResults);
    } catch (error) {
      console.error('Failed to load assessment results:', error);
    }
  };

  // State to track previous targets to prevent unnecessary API calls
  const [previousTargetsHash, setPreviousTargetsHash] = useState<string>('');
  
  // Load assessment results when targets are manually added/updated (not during initial load)
  useEffect(() => {
    const loadAssessmentResultsEffect = async () => {
      // Skip if data is loading or no targets
      if (isDataLoading || assessmentTargets.length === 0) return;
      
      // Skip if this is the initial project load (handled in loadProjectData)
      if (project?.id === previousProjectId) return;
      
      // Create hash of current targets to compare with previous
      const currentTargetsHash = assessmentTargets.map(t => `${t.id}-${t.label}`).sort().join('|');
      
      // Only load if targets actually changed
      if (currentTargetsHash === previousTargetsHash) return;
      
      try {
        console.log('Loading assessment results for manually updated targets:', assessmentTargets.map(t => t.label));
        
        // Load results for all targets at once
        await loadAllAssessmentResults(assessmentTargets);
        
        // Update previous targets hash
        setPreviousTargetsHash(currentTargetsHash);
      } catch (error) {
        console.error('Failed to load assessment results:', error);
      }
    };
    
    loadAssessmentResultsEffect();
  }, [assessmentTargets, isDataLoading, previousTargetsHash, project?.id, previousProjectId]);

  const removeAssessmentResult = (id: string) => {
    setAssessmentResults(prev => prev.filter(result => result.id !== id));
  };

  const updateAssessmentResult = (id: string, field: string, value: any) => {
    setAssessmentResults(prev => 
      prev.map(result => 
        result.id === id ? { ...result, [field]: value } : result
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProject = { 
        ...project, 
        name: `Đánh giá an ninh mạng - ${systemName}`,
        updatedAt: new Date().toISOString() 
      };
      onSave(updatedProject);
      
      toast.success("Dự án đã được cập nhật thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật dự án");
    } finally {
      setIsLoading(false);
    }
  };



  // Create refs for dynamic targets
  useEffect(() => {
    appTargets.forEach(target => {
      if (!appTargetRefs.current[target.id]) {
        appTargetRefs.current[target.id] = React.createRef<HTMLDivElement>();
      }
    });
    sourceCodeTargets.forEach(target => {
      if (!sourceCodeTargetRefs.current[target.id]) {
        sourceCodeTargetRefs.current[target.id] = React.createRef<HTMLDivElement>();
      }
    });
  }, [appTargets, sourceCodeTargets]);

  return (
    <div className="h-full flex flex-col">      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 border-b border-sidebar-border">
        <div className="container mx-auto px-6 py-4 h-[59px] flex items-center">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-semibold text-foreground">
              Chỉnh sửa: {project.name}
            </h1>
            
            <div className="flex items-center gap-3 ml-auto">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="h-9 px-4"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button variant="ghost" onClick={onBack} className="h-9 px-3">
                <X className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="container mx-auto px-6 py-6">
          {/* Loading State */}
          {isDataLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Đang tải dữ liệu dự án...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && !isDataLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-destructive mb-4">
                  <X className="w-12 h-12 mx-auto mb-2" />
                </div>
                <p className="text-destructive font-medium mb-2">Lỗi tải dữ liệu</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="h-9"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          {!isDataLoading && !error && (
            <div className="w-full space-y-6">
            {/* Section I: General Information */}
            <div id="general-info" ref={generalInfoRef} className="scroll-mt-20">
              <Card className="shadow-sm">
                <div className="p-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2 px-2">
                      I. Thông tin chung
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSection1Collapsed(!isSection1Collapsed)}
                      className="h-2 w-2 p-0"
                    >
                      {isSection1Collapsed ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronUp className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
                
                {!isSection1Collapsed && (
                  <CardContent className="p-1 space-y-2">
                    <div id="system-name" ref={systemNameRef} className="scroll-mt-20">
                      <div className="flex items-center gap-4">
                        <h3 className="text-base font-medium text-foreground whitespace-nowrap pl-2">1. Đối tượng được kiểm tra đánh giá an ninh mạng ứng dụng là:</h3>
                        <Input
                          value={systemName}
                          onChange={(e) => setSystemName(e.target.value)}
                          onBlur={handleSystemNameUpdate}
                          placeholder="Nhập tên hệ thống..."
                          className="h-9 flex-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Assessment Targets */}
                    <div id="target-assessment" ref={targetAssessmentRef} className="scroll-mt-20">
                      <AssessmentTargetSection
                        systemName={systemName}
                        assessmentTargets={assessmentTargets}
                        vulnerabilities={vulnerabilities}
                        editingVuln={editingVuln}
                        addAssessmentTarget={addAssessmentTarget}
                        removeAssessmentTarget={removeAssessmentTarget}
                        updateAssessmentTarget={updateAssessmentTarget}
                        saveAssessmentTarget={saveAssessmentTarget}
                        removeUnsavedTarget={removeUnsavedTarget}
                        addVulnerability={addVulnerability}
                        updateVulnerability={updateVulnerability}
                        removeVulnerability={removeVulnerability}
                        saveVulnerability={saveVulnerability}
                        cancelVulnerabilityEdit={cancelVulnerabilityEdit}
                        editVulnerability={editVulnerability}
                        updateVulnerabilityImage={updateVulnerabilityImage}
                        removeVulnerabilityImage={removeVulnerabilityImage}
                        projectId={project?.id}
                      />
                    </div>

                    <Separator />

                    {/* Assessment Scope */}
                    <div className="scroll-mt-20">
                      <AssessmentScopeSection
                        assessmentScopes={assessmentScopes}
                        addAssessmentScope={addAssessmentScope}
                        removeAssessmentScope={removeAssessmentScope}
                        updateAssessmentScope={updateAssessmentScope}
                      />
                    </div>



                    <Separator />

                    {/* Application Info Section */}
                    <div className="scroll-mt-20">
                      <ApplicationInfoSection
                        applicationInfoRows={applicationInfoRows}
                        addApplicationInfoRow={addApplicationInfoRow}
                        removeApplicationInfoRow={removeApplicationInfoRow}
                        updateApplicationInfoRow={updateApplicationInfoRow}
                        shouldCallAPI={true}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Section II: Detailed Results */}
            <div id="detailed-results" ref={detailedResultsRef} className="scroll-mt-20">
              <Card className="shadow-sm">
                <div className="p-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2 px-2">
                      II. Kết quả đánh giá chi tiết
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSection2Collapsed(!isSection2Collapsed)}
                      className="h-2 w-2 p-0"
                    >
                      {isSection2Collapsed ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronUp className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
                
                {!isSection2Collapsed && (
                  <CardContent className="p-2 space-y-2">
                    {assessmentTargets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có đối tượng đánh giá nào được định nghĩa</p>
                        <p className="text-sm mt-2">Vui lòng thêm đối tượng đánh giá ở phần "I. Thông tin chung" để hiển thị kết quả đánh giá</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assessmentTargets.map((target, index) => {
                          // Handle both temporary and persisted target IDs
                          let numericTargetId;
                          if (target.id.toString().startsWith('target_temp_')) {
                            // For temporary targets, use the backend mapping if available
                            numericTargetId = targetBackendMapping[target.id] || null;
                          } else {
                            // For persisted targets, parse the ID
                            numericTargetId = parseInt(target.id);
                          }
                          
                          // Filter assessment results for this specific target
                          const targetResults = numericTargetId ? assessmentResults.filter(result => 
                            result.target_id === numericTargetId
                          ) : [];
                          
                          return (
                            <div key={target.id} className="space-y-2">
                              <AssessmentResultsSection
                                title={`${index + 1}. Kết quả ${target.label}`}
                                assessmentResults={targetResults}
                                addAssessmentResult={() => {
                                  if (numericTargetId) {
                                    addAssessmentResult(undefined, numericTargetId, target.label);
                                  } else {
                                    // For unsaved temporary targets, show a message or save first
                                    toast.error('Vui lòng lưu đối tượng đánh giá trước khi thêm kết quả');
                                  }
                                }}
                                removeAssessmentResult={removeAssessmentResult}
                                updateAssessmentResult={updateAssessmentResult}
                                targetId={numericTargetId}
                                projectId={project.id}
                                targetName={target.label}
                                hideAddButton={!numericTargetId}
                              />
                              {index < assessmentTargets.length - 1 && (
                                <div className="border-b border-border mt-6"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};