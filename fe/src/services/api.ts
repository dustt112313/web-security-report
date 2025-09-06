const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8889/api/v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    username: string;
    role: string;
    email?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface CreateProjectRequest {
  project_name: string;
  system_name?: string;
}

export interface UpdateProjectRequest {
  project_name?: string;
  system_name?: string;
  description?: string;
  status?: string;
}

export interface ProjectData {
  id: number;
  project_name: string;
  system_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface Target {
  id: number;
  name: string;
  url?: string;
  description?: string;
}

export interface Scope {
  id: number;
  name: string;
  description?: string;
}

export interface Bug {
  id: number;
  vulnerability_heading: string;
  severity_text: string;
  description: string;
  recommendation_content: string;
  project_id: number;
  target_id: number;
  bug_type: string;
  affected_objects?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateBugRequest {
  vulnerability_heading: string;
  severity_text: string;
  description: string;
  recommendation_content: string;
  project_id: number;
  target_id: number;
  bug_type: string;
  affected_objects?: string[];
}

export interface UpdateBugRequest {
  vulnerability_heading?: string;
  severity_text?: string;
  description?: string;
  recommendation_content?: string;
  project_id?: number;
  target_id?: number;
  bug_type?: string;
  affected_objects?: string[];
}

export interface ProjectAllDataTarget {
  id: number;
  name: string;
}

export interface ProjectAllDataScope {
  id: number;
  object: string;
  info: string;
}

export interface CollectedInformationResponse {
  id: number;
  information: string;
  project_id: number;
}

export interface ProjectAllDataResponse {
  project_name: string;
  targets: ProjectAllDataTarget[];
  scope: ProjectAllDataScope[];
  application_info: string[];
  collected_information: CollectedInformationResponse[];
  list_report?: {
    ungdung?: Array<{
      name: string;
      severity: string;
      description: string;
      recommendation: string;
    }>;
  };
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Sending login request to:', `${this.baseURL}/auth/login`);
      console.log('📝 Credentials:', { username: credentials.username });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('⏰ Login request timed out after 10 seconds');
      }, 10000);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      clearTimeout(timeoutId);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 0 || response.type === 'opaque') {
          console.error('❌ CORS or network error detected');
          throw new Error('Network error or CORS issue. Please check your connection.');
        }
        
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.message || 'Đăng nhập thất bại');
      }

      const data: LoginResponse = await response.json();
      console.log('✅ Login successful:', { username: data.user.username, role: data.user.role });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Login request was aborted due to timeout');
        throw new Error('Yêu cầu đăng nhập bị timeout. Vui lòng thử lại.');
      }
      
      console.error('❌ Login error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Có lỗi xảy ra khi đăng nhập');
    }
  }

  async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 0 || response.type === 'opaque') {
          throw new Error('Network error or CORS issue. Please check your connection.');
        }
        
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || 'Không thể lấy thông tin người dùng');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Có lỗi xảy ra khi lấy thông tin người dùng');
    }
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error('Network error or CORS issue. Please check your connection.');
      }
      
      // Xử lý 401 - Token hết hạn hoặc không hợp lệ
      if (response.status === 401) {
        // Xóa token và user data khỏi localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        
        // Chuyển hướng về trang login bằng cách reload trang
        // Điều này sẽ trigger useAuth hook để hiển thị LoginForm
        window.location.reload();
        
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getProjects(): Promise<ProjectData[]> {
    return this.makeAuthenticatedRequest('/projects');
  }

  async createProject(data: CreateProjectRequest): Promise<ProjectData> {
    return this.makeAuthenticatedRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(projectId: number, data: UpdateProjectRequest): Promise<ProjectData> {
    return this.makeAuthenticatedRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProjectAllData(projectId: number): Promise<ProjectAllDataResponse> {
    return this.makeAuthenticatedRequest(`/projects/${projectId}/all-data`);
  }

  async getTargets(projectId?: number): Promise<Target[]> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.makeAuthenticatedRequest(`/targets${params}`);
  }

  async getTarget(id: number): Promise<Target> {
    return this.makeAuthenticatedRequest(`/targets/${id}`);
  }

  async createAssessmentTarget(projectId: number, targetName: string) {
    return this.makeAuthenticatedRequest('/targets', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        target_name: targetName
      })
    });
  }

  async updateAssessmentTarget(targetId: number, targetName: string) {
    return this.makeAuthenticatedRequest(`/targets/${targetId}`, {
      method: 'PUT',
      body: JSON.stringify({
        target_name: targetName
      })
    });
  }

  async deleteAssessmentTarget(targetId: number) {
    return this.makeAuthenticatedRequest(`/targets/${targetId}`, {
      method: 'DELETE'
    });
  }

  async createAssessmentScope(projectId: number, doituong: string, thongtin: string) {
    return this.makeAuthenticatedRequest('/scope', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        doituong: doituong,
        thongtin: thongtin
      })
    });
  }

  async updateAssessmentScope(scopeId: number, projectId: number, doituong: string, thongtin: string) {
    return this.makeAuthenticatedRequest(`/scope/${scopeId}`, {
      method: 'PUT',
      body: JSON.stringify({
        project_id: projectId,
        doituong: doituong,
        thongtin: thongtin
      })
    });
  }

  async deleteAssessmentScope(scopeId: number) {
    return this.makeAuthenticatedRequest(`/scope/${scopeId}`, {
      method: 'DELETE'
    });
  }

  async getScope(): Promise<Scope[]> {
    return this.makeAuthenticatedRequest('/scope');
  }

  async getScopeItem(id: number): Promise<Scope> {
    return this.makeAuthenticatedRequest(`/scope/${id}`);
  }

  async getCollectedInformation() {
    return this.makeAuthenticatedRequest('/collected-information');
  }

  async getCollectedInformationItem(id: number) {
    return this.makeAuthenticatedRequest(`/collected-information/${id}`);
  }

  async createCollectedInformation(projectId: number, information: string) {
    return this.makeAuthenticatedRequest('/collected-information', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        information: information
      })
    });
  }

  async updateCollectedInformation(infoId: number, projectId: number, information: string) {
    return this.makeAuthenticatedRequest(`/collected-information/${infoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        project_id: projectId,
        information: information
      })
    });
  }

  async deleteCollectedInformation(infoId: number) {
    return this.makeAuthenticatedRequest(`/collected-information/${infoId}`, {
      method: 'DELETE'
    });
  }

  async getBugs(): Promise<Bug[]> {
    return this.makeAuthenticatedRequest('/bugs');
  }

  async getBug(id: number): Promise<Bug> {
    return this.makeAuthenticatedRequest(`/bugs/${id}`);
  }

  async createBug(bugData: CreateBugRequest): Promise<Bug> {
    return this.makeAuthenticatedRequest('/bugs', {
      method: 'POST',
      body: JSON.stringify(bugData),
    });
  }

  async updateBug(bugId: number, bugData: UpdateBugRequest): Promise<Bug> {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}`, {
      method: 'PUT',
      body: JSON.stringify(bugData),
    });
  }

  async deleteBug(bugId: number): Promise<void> {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}`, {
      method: 'DELETE'
    });
  }

  async getTargetBugs(targetId: number): Promise<Bug[]> {
    return this.makeAuthenticatedRequest(`/targets/${targetId}/bugs`);
  }

  async getBugsByTarget(targetId: number): Promise<Bug[]> {
    return this.makeAuthenticatedRequest(`/targets/${targetId}/bugs`);
  }

  async getBugImages() {
    return this.makeAuthenticatedRequest('/bug-images');
  }

  async getBugImage(id: number) {
    return this.makeAuthenticatedRequest(`/bug-images/${id}`);
  }

  async getBugImagesByBug(bugId: number) {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}/images`);
  }

  async getAffectedObjects() {
    return this.makeAuthenticatedRequest('/affected-objects');
  }

  async getAffectedObject(id: number) {
    return this.makeAuthenticatedRequest(`/affected-objects/${id}`);
  }

  async getBugAffectedObjects(bugId: number) {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}/affected-objects`);
  }

  async getCVEInformation() {
    return this.makeAuthenticatedRequest('/cve-information');
  }

  async getCVEInformationItem(id: number) {
    return this.makeAuthenticatedRequest(`/cve-information/${id}`);
  }

  async searchCVEInformation() {
    return this.makeAuthenticatedRequest('/cve-information/search');
  }

  async getBugCVEInformation(bugId: number) {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}/cve-information`);
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return this.makeAuthenticatedRequest('/recommendations');
  }

  async getRecommendation(id: number): Promise<Recommendation> {
    return this.makeAuthenticatedRequest(`/recommendations/${id}`);
  }

  async getBugRecommendations(bugId: number): Promise<Recommendation[]> {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}/recommendations`);
  }

  async getBugDetailedRecommendations(bugId: number) {
    return this.makeAuthenticatedRequest(`/bugs/${bugId}/recommendations/detailed`);
  }
}

const api = new ApiService();
export { api };
export default api;