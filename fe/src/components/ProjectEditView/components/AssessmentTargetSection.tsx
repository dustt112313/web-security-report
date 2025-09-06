import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Trash2, Plus } from "lucide-react";
import { AssessmentTargetSectionProps } from "../types";


export function AssessmentTargetSection({
  assessmentTargets,
  systemName,
  addAssessmentTarget,
  removeAssessmentTarget,
  updateAssessmentTarget,
  saveAssessmentTarget,
  removeUnsavedTarget,
  hideAddButton = false,
  projectId
}: AssessmentTargetSectionProps) {

  const handleAddTarget = () => {
    // Only create local input, don't send API
    addAssessmentTarget({
      label: "",
      description: ""
    });
  };

  const handleUpdateTarget = (targetId: string, field: string, value: string) => {
    // Only update local state, don't call API
    updateAssessmentTarget(targetId, field as any, value);
  };

  const handleRemoveTarget = async (targetId: string) => {
    await removeAssessmentTarget(targetId);
  };

  const handleInputBlur = async (targetId: string, value: string) => {
    if (!value.trim()) {
      // If input is empty, remove the target
      removeUnsavedTarget(targetId);
    } else {
      // If input has value, save to backend
      await saveAssessmentTarget(targetId, value.trim());
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium pl-2">
        2. Đối tượng được kiểm tra đánh giá an ninh mạng ứng dụng là {systemName}, bao gồm:
      </h3>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Assessment Targets Management */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Danh sách đối tượng đánh giá</Label>
                {!hideAddButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTarget}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm đối tượng
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                {assessmentTargets.map((target) => (
                  <div key={target.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        value={target.label}
                        onChange={(e) => handleUpdateTarget(target.id, 'label', e.target.value)}
                        onBlur={(e) => handleInputBlur(target.id, e.target.value)}
                        placeholder="Tên đối tượng (vd: Ứng dụng web, Mã nguồn)"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTarget(target.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}