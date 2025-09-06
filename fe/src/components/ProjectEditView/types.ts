import { Project } from "../../types/auth";

export interface ProjectEditViewProps {
  project: Project;
  onBack: () => void;
  onSave: (updatedProject: Project) => void;
  onCancel: () => void;
  onTOCChange?: (tocItems: TOCItem[]) => void;
  onActiveSection?: (sectionId: string) => void;
}

export interface AssessmentTarget {
  id: string;
  label: string;
  description: string;
}

export interface AssessmentScope {
  id: string;
  label: string;
  description: string;
}

export interface InfoTableRow {
  id: string;
  target: string;
  info: string;
}

export interface TOCItem {
  id: string;
  title: string;
  parent?: string;
  isActive?: boolean;
  number?: string;
  level?: number;
}

export interface VulnerabilityImage {
  id: string;
  url: string;
  description: string;
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: 'Thấp' | 'Trung Bình' | 'Cao' | 'Nghiêm Trọng';
  description: string;
  impact: string;
  recommendation: string;
  images: VulnerabilityImage[];
  targetId: string;
}

export interface VulnerabilityFormProps {
  targetId: string;
  vulnerabilities: Vulnerability[];
  editingVulnId: string | null;
  vulnId: string | null;
  updateVulnerability: (vulnId: string, field: string, value: any) => void;
  updateVulnerabilityImage: (vulnId: string, imageIndex: number, field: keyof VulnerabilityImage, value: any) => void;
  removeVulnerabilityImage: (vulnId: string, imageIndex: number) => void;
  editVulnerability: (vulnId: string) => void;
  removeVulnerability: (vulnId: string) => void;
  saveVulnerability: () => void;
  cancelVulnerabilityEdit: () => void;
}

export interface SingleImageUploadProps {
  vulnId: string;
  imageIndex: number;
  image: VulnerabilityImage;
  updateVulnerabilityImage: (vulnId: string, imageIndex: number, field: keyof VulnerabilityImage, value: any) => void;
  removeVulnerabilityImage: (vulnId: string, imageIndex: number) => void;
}

export interface AssessmentTargetSectionProps {
  sectionTitle?: string;
  sectionNumber?: string;
  systemName?: string;
  assessmentTargets: AssessmentTarget[];
  vulnerabilities: Vulnerability[];
  editingVuln: string | null;
  hideAddButton?: boolean;
  addAssessmentTarget: (target: Omit<AssessmentTarget, 'id'>) => void;
  removeAssessmentTarget: (id: string) => void;
  updateAssessmentTarget: (id: string, field: string, value: any) => void;
  saveAssessmentTarget: (id: string, targetName: string) => void;
  removeUnsavedTarget: (id: string) => void;
  addVulnerability: (targetId: string) => void;
  updateVulnerability: (vulnId: string, field: string, value: any) => void;
  removeVulnerability: (vulnId: string) => void;
  editVulnerability: (vulnId: string) => void;
  updateVulnerabilityImage: (vulnId: string, imageIndex: number, field: keyof VulnerabilityImage, value: any) => void;
  removeVulnerabilityImage: (vulnId: string, imageIndex: number) => void;
  saveVulnerability: () => void;
  cancelVulnerabilityEdit: () => void;
  projectId?: number;
}

export interface InfoTableSectionProps {
  infoTableRows: InfoTableRow[];
  addInfoTableRow: () => void;
  removeInfoTableRow: (id: string) => void;
  updateInfoTableRow: (id: string, field: keyof InfoTableRow, value: string) => void;
}

export interface TOCSectionProps {
  tocItems: TOCItem[];
  scrollToSection: (sectionId: string) => void;
  activeSection: string;
  onClose?: () => void;
}

export interface UtilsProps {
  getSeverityStyle: (severity: Vulnerability['severity']) => any;
  toRoman: (num: number) => string;
  getSeverityIcon: (severity: Vulnerability['severity']) => any;
}

export interface AssessmentScopeSectionProps {
  assessmentScopes: AssessmentScope[];
  hideAddButton?: boolean;
  addAssessmentScope: () => void;
  removeAssessmentScope: (id: string) => void;
  updateAssessmentScope: (id: string, field: string, value: any, shouldCallAPI?: boolean) => void;
}

export interface ApplicationInfoRow {
  id: string;
  info: string;
  content: string;
}

export interface ApplicationInfoSectionProps {
  applicationInfoRows: ApplicationInfoRow[];
  addApplicationInfoRow: () => void;
  removeApplicationInfoRow: (id: string) => void;
  updateApplicationInfoRow: (id: string, info: string, shouldCallAPI?: boolean) => void;
  shouldCallAPI?: boolean;
}

export interface EvidenceImage {
  url: string;
  description: string;
  fileName?: string;
  fileSize?: number;
}

export interface AssessmentResult {
  id: string;
  name: string;
  severity: 'Thấp' | 'Trung Bình' | 'Cao' | 'Nghiêm Trọng';
  description: string;
  recommendation: string;
  affected_objects?: string[];
  evidence_images?: EvidenceImage[];
  target_id?: number;
  bug_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentResultsSectionProps {
  assessmentResults: AssessmentResult[];
  hideAddButton?: boolean;
  title?: string;
  targetId?: number;
  projectId?: number;
  targetName?: string;
  addAssessmentResult: (result?: AssessmentResult) => void;
  removeAssessmentResult: (id: string) => void;
  updateAssessmentResult: (id: string, field: string, value: any) => void;
}