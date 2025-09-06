import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Dialog, DialogContent, DialogTrigger } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Trash2, Plus, ChevronDown, ChevronRight, ZoomIn, ImageIcon, X, Upload } from "lucide-react";
import { AssessmentResultsSectionProps } from "../types";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "../../../services/api";
import { Bug, CreateBugRequest, UpdateBugRequest } from "../../../services/api";

export function AssessmentResultsSection({
  assessmentResults,
  addAssessmentResult,
  removeAssessmentResult,
  updateAssessmentResult,
  hideAddButton = false,
  title,
  targetId,
  projectId,
  targetName
}: AssessmentResultsSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers when component unmounts
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      debounceTimers.current = {};
    };
  }, []);

  // Image upload helper functions
  const handleImageUpload = (file: File, evidenceIndex: number, resultId: string, showSuccessMessage: boolean = false) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return false;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ');
        return false;
      }
      
      try {
        // TODO: Implement actual file upload
        const url = URL.createObjectURL(file);
        const currentResult = assessmentResults.find(r => r.id === resultId);
        const newEvidence = [...(currentResult?.evidence_images || [])];
        newEvidence[evidenceIndex] = { 
          ...newEvidence[evidenceIndex], 
          url,
          fileName: file.name,
          fileSize: file.size,
        };
        updateAssessmentResult(resultId, 'evidence_images', newEvidence);
    
        
        return true;
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Có lỗi xảy ra khi xử lý ảnh');
        return false;
      }
    };

  const handlePasteImage = (e: React.ClipboardEvent, evidenceIndex: number, resultId: string) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file, evidenceIndex, resultId, true);
          }
          break;
        }
      }
    };

  // Note: Bug loading is now handled by parent component (ProjectEditView)
  // to ensure proper order: getProjectAllData first, then getBugsByTarget

  const toggleExpanded = useCallback((id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  }, [expandedItems]);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'Nghiêm Trọng':
        return 'text-red-700 bg-red-200';
      case 'Cao':
        return 'text-orange-700 bg-orange-200';
      case 'Trung Bình':
        return 'text-yellow-700 bg-yellow-200';
      case 'Thấp':
        return 'text-green-700 bg-green-200';
      default:
        return 'text-gray-700 bg-gray-200';
    }
  }, []);

  // Debounce function for API calls with closure fix
  const debounceApiCall = useCallback((key: string, callback: () => void, delay: number = 1000) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
      delete debounceTimers.current[key];
    }
    debounceTimers.current[key] = setTimeout(() => {
      callback();
      delete debounceTimers.current[key];
    }, delay);
  }, []);

  // Validation function
  const validateVulnerabilityName = useCallback((name: string, resultId: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationErrors(prev => ({
        ...prev,
        [resultId]: 'Tên lỗ hổng là bắt buộc'
      }));
      return false;
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[resultId];
        return newErrors;
      });
      return true;
    }
  }, []);

  // API Integration Functions
  const handleCreateBug = useCallback(async (bugData: CreateBugRequest) => {
    if (!targetId || !projectId) {
      setError('Target ID and Project ID are required to create bug');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newBug = await api.createBug(bugData);
      console.log('Bug created successfully:', newBug);
      addAssessmentResult();
    } catch (err) {
      console.error('Error creating bug:', err);
      setError(err instanceof Error ? err.message : 'Failed to create bug');
    } finally {
      setLoading(false);
    }
  }, [targetId, projectId, addAssessmentResult]);

  const handleUpdateBug = useCallback(async (bugId: string, updateData: UpdateBugRequest) => {
    setLoading(true);
    setError(null);
    try {
      const numericBugId = parseInt(bugId);
      if (isNaN(numericBugId)) {
        throw new Error('Invalid bug ID');
      }
      
      const updatedBug = await api.updateBug(numericBugId, updateData);
      console.log('Bug updated successfully:', updatedBug);
      // The parent component should handle updating the local state
    } catch (err) {
      console.error('Error updating bug:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bug');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteBug = useCallback(async (bugId: string) => {
    // Nếu là item tạm thời, chỉ xóa local state
    if (bugId.startsWith('temp_')) {
      removeAssessmentResult(bugId);
      return;
    }

    // Nếu là item thật, gọi API để xóa
    setLoading(true);
    setError(null);
    try {
      const numericBugId = parseInt(bugId);
      if (isNaN(numericBugId)) {
        throw new Error('Invalid bug ID');
      }
      
      await api.deleteBug(numericBugId);
      console.log('Bug deleted successfully');
      removeAssessmentResult(bugId);
    } catch (err) {
      console.error('Error deleting bug:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete bug');
    } finally {
      setLoading(false);
    }
  }, [removeAssessmentResult]);

  // Enhanced update function that calls API
  const handleUpdateAssessmentResult = useCallback(async (id: string, field: string, value: any) => {
    // Update local state immediately for better UX
    updateAssessmentResult(id, field, value);
    
    const result = assessmentResults.find(r => r.id === id);
    if (!result) return;

    // Kiểm tra nếu đây là item tạm thời và user đang nhập tên
    if (id.startsWith('temp_') && field === 'name' && value.trim()) {
      // Xác định bug_type dựa trên targetName
      const bugType = targetName && targetName.includes('Mã nguồn') ? 'manguon' : 'ungdung';
      
      // Tạo bug mới trên server khi user nhập tên
      const createData: CreateBugRequest = {
        vulnerability_heading: value,
        severity_text: result.severity,
        description: result.description,
        recommendation_content: result.recommendation,
        project_id: projectId || 0,
        target_id: targetId || 0,
        bug_type: bugType,
        affected_objects: result.affected_objects || []
      };
      
      try {
        const newBug = await api.createBug(createData);
        console.log('Bug created successfully:', newBug);
        // Cập nhật id từ temp sang id thật từ server
        updateAssessmentResult(id, 'id', newBug.id.toString());
      } catch (err) {
        console.error('Error creating bug:', err);
        setError(err instanceof Error ? err.message : 'Failed to create bug');
      }
      return;
    }

    // Nếu không phải item tạm thời, thực hiện update bình thường
    if (!id.startsWith('temp_')) {
      const updateData: UpdateBugRequest = {
        vulnerability_heading: result.name,
        severity_text: result.severity,
        description: result.description,
        recommendation_content: result.recommendation,
        project_id: projectId,
        target_id: result.target_id || targetId,
        bug_type: result.bug_type,
        affected_objects: result.affected_objects
      };

      // Update the specific field
      if (field === 'severity') {
        updateData.severity_text = value;
      } else if (field === 'name') {
        updateData.vulnerability_heading = value;
      } else if (field === 'recommendation') {
        updateData.recommendation_content = value;
      } else if (field in updateData) {
        (updateData as any)[field] = value;
      }

      // Call API to sync with backend
      await handleUpdateBug(id, updateData);
    }
  }, [assessmentResults, targetName, projectId, targetId, updateAssessmentResult, handleUpdateBug]);

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        {title && <h3 className="text-base font-semibold text-gray-800 pl-2">{title}</h3>}
        {!hideAddButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Gọi function từ parent component
              addAssessmentResult();
            }}
            disabled={useMemo(() => loading || Object.keys(validationErrors).length > 0, [loading, validationErrors])}
            className="h-8 px-3"
            title={useMemo(() => Object.keys(validationErrors).length > 0 ? 'Vui lòng hoàn thành các trường bắt buộc trước khi thêm mới' : '', [validationErrors])}
          >
            <Plus className="w-4 h-4 mr-1" />
            {loading ? 'Đang xử lý...' : 'Thêm điểm yếu, lỗ hổng'}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {assessmentResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có kết quả đánh giá nào
          </div>
        ) : (
          <div className="space-y-2">
            {assessmentResults.map((result, index) => {
              const isExpanded = expandedItems.has(result.id);
              const itemIndex = useMemo(() => `${title?.split('.')[0]}.${index + 1}`, [title, index]);
              
              return (
                <div key={result.id} className="border rounded-lg">
                  {/* Collapsed Header */}
                  <div 
                    className={useMemo(() => `flex items-center justify-between py-1.5 px-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isExpanded ? 'hover:rounded-t-lg' : 'hover:rounded-lg'
                    }`, [isExpanded])}
                    onClick={() => toggleExpanded(result.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="font-medium text-gray-700">{itemIndex}</span>
                      <span className="text-gray-900 p-2 rounded-full">
                         {result.name || 'Chưa có tên lỗ hổng'}
                       </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.severity && (
                        <span className={useMemo(() => `px-3 py-2 rounded-full text-sm font-semibold min-w-[100px] text-center shadow-md ${
                          getSeverityColor(result.severity)
                        }`, [result.severity, getSeverityColor])}>
                          {result.severity}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBug(result.id);
                        }}
                        disabled={loading}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Xóa lỗ hổng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      <div className="grid grid-cols-[6fr_1fr] gap-8">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 pl-2">Tên lỗ hổng *</Label>
                          <Input
                            value={result.name}
                            onChange={(e) => {
                              // Cập nhật local state ngay lập tức
                              updateAssessmentResult(result.id, 'name', e.target.value);
                              
                              // Validate ngay khi user nhập
                              validateVulnerabilityName(e.target.value, result.id);
                              
                              // Debounce API call
                              if (e.target.value.trim()) {
                                debounceApiCall(`name_${result.id}`, () => {
                                  handleUpdateAssessmentResult(result.id, 'name', e.target.value);
                                }, 1500);
                              }
                            }}
                            onBlur={(e) => {
                              // Validate khi blur
                              const isValid = validateVulnerabilityName(e.target.value, result.id);
                              
                              // Chỉ gọi API khi có tên và valid
                              if (isValid && e.target.value.trim()) {
                                // Clear debounce timer và gọi API ngay
                                if (debounceTimers.current[`name_${result.id}`]) {
                                  clearTimeout(debounceTimers.current[`name_${result.id}`]);
                                }
                                handleUpdateAssessmentResult(result.id, 'name', e.target.value);
                              }
                            }}
                            disabled={loading}
                            className={useMemo(() => `mt-1 ${
                              validationErrors[result.id] 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : ''
                            }`, [validationErrors, result.id])}
                            placeholder="Nhập tên lỗ hổng"
                          />
                          {validationErrors[result.id] && (
                            <p className="text-red-500 text-xs mt-1 pl-2">
                              {validationErrors[result.id]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 pl-3" >Mức độ</Label>
                          <Select
                            value={result.severity}
                            onValueChange={(value) => {
                              // Cập nhật local state ngay lập tức
                              updateAssessmentResult(result.id, 'severity', value);
                              
                              // Gọi API ngay lập tức cho severity (không cần debounce)
                              handleUpdateAssessmentResult(result.id, 'severity', value);
                            }}
                            disabled={loading}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Chọn mức độ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nghiêm Trọng">Nghiêm Trọng</SelectItem>
                              <SelectItem value="Cao">Cao</SelectItem>
                              <SelectItem value="Trung Bình">Trung Bình</SelectItem>
                              <SelectItem value="Thấp">Thấp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Mô tả và Khuyến nghị cùng hàng */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 pl-2">Mô tả</Label>
                          <Textarea
                            value={result.description}
                            onChange={(e) => {
                              // Cập nhật local state ngay lập tức
                              updateAssessmentResult(result.id, 'description', e.target.value);
                              
                              // Debounce API call - chỉ gọi nếu không phải temp item hoặc đã có tên
                              if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                debounceApiCall(`description_${result.id}`, () => {
                                  handleUpdateAssessmentResult(result.id, 'description', e.target.value);
                                }, 2000);
                              }
                            }}
                            onBlur={(e) => {
                              // Gọi API ngay khi blur - chỉ gọi nếu không phải temp item hoặc đã có tên
                              if (debounceTimers.current[`description_${result.id}`]) {
                                clearTimeout(debounceTimers.current[`description_${result.id}`]);
                              }
                              if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                handleUpdateAssessmentResult(result.id, 'description', e.target.value);
                              }
                            }}
                            disabled={loading}
                            className="mt-1 min-h-[80px] resize-none"
                            placeholder="Nhập mô tả chi tiết về lỗ hổng"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 pl-2">Khuyến nghị</Label>
                          <Textarea
                            value={result.recommendation}
                            onChange={(e) => {
                              // Cập nhật local state ngay lập tức
                              updateAssessmentResult(result.id, 'recommendation', e.target.value);
                              
                              // Debounce API call - chỉ gọi nếu không phải temp item hoặc đã có tên
                              if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                debounceApiCall(`recommendation_${result.id}`, () => {
                                  handleUpdateAssessmentResult(result.id, 'recommendation', e.target.value);
                                }, 2000);
                              }
                            }}
                            onBlur={(e) => {
                              // Gọi API ngay khi blur - chỉ gọi nếu không phải temp item hoặc đã có tên
                              if (debounceTimers.current[`recommendation_${result.id}`]) {
                                clearTimeout(debounceTimers.current[`recommendation_${result.id}`]);
                              }
                              if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                handleUpdateAssessmentResult(result.id, 'recommendation', e.target.value);
                              }
                            }}
                            disabled={loading}
                            className="mt-1 min-h-[80px] resize-none"
                            placeholder="Nhập khuyến nghị khắc phục"
                          />
                        </div>
                      </div>

                      {/* Đối tượng ảnh hưởng */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 pl-2">Đối tượng ảnh hưởng</Label>
                        <div className="mt-1 space-y-2">
                          {/* Hiển thị các affected objects hiện có */}
                          {(Array.isArray(result.affected_objects) ? result.affected_objects : []).map((obj, objIndex) => (
                            <div key={objIndex} className="flex items-center space-x-2">
                              <Input
                                value={obj}
                                onChange={(e) => {
                                  const newObjects = [...(Array.isArray(result.affected_objects) ? result.affected_objects : [])];
                                  newObjects[objIndex] = e.target.value;
                                  
                                  // Cập nhật local state ngay lập tức
                                  updateAssessmentResult(result.id, 'affected_objects', newObjects);
                                  
                                  // Debounce API call - chỉ gọi nếu không phải temp item hoặc đã có tên
                                  if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                    debounceApiCall(`affected_objects_${result.id}`, () => {
                                      handleUpdateAssessmentResult(result.id, 'affected_objects', newObjects);
                                    }, 2000);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Gọi API ngay khi blur - chỉ gọi nếu không phải temp item hoặc đã có tên
                                  if (debounceTimers.current[`affected_objects_${result.id}`]) {
                                    clearTimeout(debounceTimers.current[`affected_objects_${result.id}`]);
                                  }
                                  const newObjects = [...(Array.isArray(result.affected_objects) ? result.affected_objects : [])];
                                  newObjects[objIndex] = e.target.value;
                                  if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                    handleUpdateAssessmentResult(result.id, 'affected_objects', newObjects);
                                  }
                                }}
                                disabled={loading}
                                className="flex-1"
                                placeholder="Nhập đối tượng bị ảnh hưởng"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newObjects = [...(Array.isArray(result.affected_objects) ? result.affected_objects : [])];
                                  newObjects.splice(objIndex, 1);
                                  updateAssessmentResult(result.id, 'affected_objects', newObjects);
                                  // Chỉ gọi API nếu không phải temp item hoặc đã có tên
                                  if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                    handleUpdateAssessmentResult(result.id, 'affected_objects', newObjects);
                                  }
                                }}
                                disabled={loading}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                title="Xóa đối tượng"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Nút thêm đối tượng mới */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentObjects = Array.isArray(result.affected_objects) ? result.affected_objects : [];
                              const newObjects = [...currentObjects, ''];
                              updateAssessmentResult(result.id, 'affected_objects', newObjects);
                            }}
                            disabled={loading}
                            className="h-8 px-3"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm đối tượng
                          </Button>
                          
                          {/* Hidden textarea for paste handling */}
                          <Textarea
                            className="sr-only"
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              const lines = pastedText.split('\n').filter(line => line.trim());
                              
                              if (lines.length > 0) {
                                const currentObjects = Array.isArray(result.affected_objects) ? result.affected_objects : [];
                                const newObjects = [...currentObjects, ...lines];
                                
                                // Cập nhật local state ngay lập tức
                                updateAssessmentResult(result.id, 'affected_objects', newObjects);
                                
                                // Gọi API ngay lập tức cho paste (không debounce) - chỉ gọi nếu không phải temp item hoặc đã có tên
                                if (!result.id.startsWith('temp_') || result.name?.trim()) {
                                  handleUpdateAssessmentResult(result.id, 'affected_objects', newObjects);
                                }
                              }
                            }}
                            placeholder="Paste text here to add multiple objects (Ctrl+V)"
                          />
                          
                          <div className="text-xs text-gray-500 mt-1">
                            Tip: Bạn có thể paste nhiều dòng text vào ô trên để thêm nhiều đối tượng cùng lúc
                          </div>
                        </div>
                      </div>

                      {/* Minh họa bằng chứng khai thác */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 pl-2">Minh họa bằng chứng khai thác</Label>
                        <div className="mt-2">
                          <div 
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                            onPaste={(e) => {
                              e.preventDefault();
                              const items = e.clipboardData?.items;
                              if (!items) return;
                              
                              for (let i = 0; i < items.length; i++) {
                                const item = items[i];
                                if (item.type.startsWith('image/')) {
                                  const file = item.getAsFile();
                                  if (file) {
                                    // Tìm slot trống đầu tiên hoặc tạo mới
                                    const currentEvidence = result.evidence_images || [];
                                    let targetIndex = currentEvidence.findIndex(ev => !ev.url);
                                    
                                    if (targetIndex === -1) {
                                      // Không có slot trống, tạo mới
                                      targetIndex = currentEvidence.length;
                                      const newEvidence = [...currentEvidence, { url: '', description: '' }];
                                      updateAssessmentResult(result.id, 'evidence_images', newEvidence);
                                      setTimeout(() => {
                                        handleImageUpload(file, targetIndex, result.id, true);
                                        }, 0);
                                    } else {
                                      // Có slot trống, sử dụng luôn
                                       handleImageUpload(file, targetIndex, result.id, true);
                                    }
                                  }
                                  break;
                                }
                              }
                            }}
                            tabIndex={0}
                            style={{ outline: 'none' }}
                          >
                            {(result.evidence_images || []).map((evidence, evidenceIndex) => (
                              <div key={evidenceIndex} className="relative border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                {/* Nút X đóng thẻ ở góc trên phải */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newEvidence = [...(result.evidence_images || [])];
                                    newEvidence.splice(evidenceIndex, 1);
                                    updateAssessmentResult(result.id, 'evidence_images', newEvidence);
                                  }}
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md z-10"
                                  title="Xóa thẻ ảnh và mô tả"
                                >
                                  <X className="w-3 h-3" />
                                </Button>

                                {/* Ảnh preview dạng ô vuông */}
                                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-gray-400 transition-colors group">
                                  {evidence.url ? (
                                    <div className="relative w-full h-full">
                                      <img
                                        src={evidence.url}
                                        alt={`Evidence ${evidenceIndex + 1}`}
                                        className="w-full h-full object-cover cursor-default"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        onError={(e) => {
                                          console.error('Image failed to load:', evidence.url);
                                          const target = e.currentTarget;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            const errorDiv = document.createElement('div');
                                            errorDiv.className = 'w-full h-full bg-gray-100 flex items-center justify-center text-gray-500';
                                            errorDiv.innerHTML = '<div class="text-center"><div class="text-xs">Lỗi tải ảnh</div></div>';
                                            parent.appendChild(errorDiv);
                                          }
                                        }}
                                      />
                                      {/* Hover buttons - không có overlay background */}
                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                        {/* Nút kính lúp xem ảnh toàn màn hình */}
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="secondary"
                                              size="xs"
                                              className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-md pointer-events-auto"
                                              title="Xem ảnh toàn màn hình"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                              }}
                                            >
                                              <ZoomIn className="w-3 h-3" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
                                            <div className="relative w-full h-full flex items-center justify-center">
                                              <img
                                                src={evidence.url}
                                                alt={`Evidence ${evidenceIndex + 1} - Full Size`}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => {
                                                  console.error('Full size image failed to load:', evidence.url);
                                                  const target = e.currentTarget;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement;
                                                  if (parent) {
                                                    const errorDiv = document.createElement('div');
                                                    errorDiv.className = 'w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500';
                                                    errorDiv.innerHTML = '<div class="text-center"><div class="text-lg mb-2">⚠️</div><div>Không thể tải ảnh</div></div>';
                                                    parent.appendChild(errorDiv);
                                                  }
                                                }}
                                              />
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                        {/* Nút xóa ảnh */}
                                        <Button
                                          variant="secondary"
                                          size="xs"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const newEvidence = [...(result.evidence_images || [])];
                                            newEvidence[evidenceIndex] = { ...newEvidence[evidenceIndex], url: '', fileName: '', fileSize: 0 };
                                            updateAssessmentResult(result.id, 'evidence_images', newEvidence);
                                          }}
                                          className="h-6 w-6 p-0 bg-red-500/90 hover:bg-red-600 text-white shadow-md pointer-events-auto"
                                          title="Xóa ảnh"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      {/* Nút upload ẩn ở góc dưới trái */}
                                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                        <Button
                                          variant="secondary"
                                          size="xs"
                                          className="h-6 w-6 p-0 bg-blue-500/90 hover:bg-blue-600 text-white shadow-md pointer-events-auto"
                                          title="Thay thế ảnh"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const fileInput = document.createElement('input');
                                            fileInput.type = 'file';
                                            fileInput.accept = 'image/*';
                                            fileInput.onchange = (event) => {
                                              const file = (event.target as HTMLInputElement).files?.[0];
                                              if (file) {
                                                handleImageUpload(file, evidenceIndex, result.id);
                                              }
                                            };
                                            fileInput.click();
                                          }}
                                        >
                                          <Upload className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                      <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                        <p className="text-xs">Thêm ảnh</p>
                                      </div>
                                      {/* Hidden file input */}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                             handleImageUpload(file, evidenceIndex, result.id);
                                             e.target.value = '';
                                          }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title="Click để upload ảnh hoặc Ctrl+V để paste"
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Ô input mô tả ảnh */}
                                <div className="mt-3">
                                  <Textarea
                                    value={evidence.description || ''}
                                    onChange={(e) => {
                                      const newEvidence = [...(result.evidence_images || [])];
                                      newEvidence[evidenceIndex] = { ...newEvidence[evidenceIndex], description: e.target.value };
                                      updateAssessmentResult(result.id, 'evidence_images', newEvidence);
                                    }}
                                    placeholder="Nhập mô tả cho ảnh này..."
                                    className="min-h-[60px] text-sm resize-none"
                                    disabled={loading}
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {/* Nút thêm ảnh mới */}
                            <div 
                              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center group"
                              onClick={() => {
                                const newEvidence = [...(result.evidence_images || []), { url: '', description: '' }];
                                updateAssessmentResult(result.id, 'evidence_images', newEvidence);
                              }}
                              tabIndex={0}
                              title="Thêm khung ảnh mới"
                            >
                              <div className="text-center text-gray-400 group-hover:text-gray-600 transition-colors">
                                <Plus className="w-8 h-8 mx-auto mb-1" />
                                <p className="text-xs">Thêm ảnh</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}