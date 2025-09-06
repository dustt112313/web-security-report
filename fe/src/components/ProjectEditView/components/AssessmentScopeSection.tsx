import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Trash2, Plus } from "lucide-react";
import { AssessmentScopeSectionProps } from "../types";

export function AssessmentScopeSection({
  assessmentScopes,
  addAssessmentScope,
  removeAssessmentScope,
  updateAssessmentScope,
  hideAddButton = false
}: AssessmentScopeSectionProps) {

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium pl-2">
        3. Phạm vi thực hiện kiểm tra đánh giá an ninh mạng cho đối tượng bao gồm:
      </h3>
    <Card>
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <Label>Danh sách phạm vi kiểm tra</Label>
            {!hideAddButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={addAssessmentScope}
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Thêm phạm vi
              </Button>
            )}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 h-8 px-1 py-0.5"></TableHead>
                <TableHead className="w-1/3 h-8 px-1 py-0.5">Đối Tượng</TableHead>
                <TableHead className="w-1/2 h-8 px-1 py-0.5">Thông tin</TableHead>
                <TableHead className="w-20 h-8 px-1 py-0.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentScopes.map((scope, index) => (
                <TableRow key={scope.id}>
                  <TableCell className="text-center font-medium px-1 py-0.5">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-1 py-0.5">
                    <Input
                      value={scope.label}
                      onChange={(e) => updateAssessmentScope(scope.id, 'label', e.target.value, false)}
                      onBlur={(e) => updateAssessmentScope(scope.id, 'label', e.target.value, true)}
                      placeholder="Nhập phạm vi kiểm tra"
                      className="border-0 p-1 h-7 focus:ring-1 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell className="px-1 py-0.5">
                    <Input
                      value={scope.description}
                      onChange={(e) => updateAssessmentScope(scope.id, 'description', e.target.value, false)}
                      onBlur={(e) => updateAssessmentScope(scope.id, 'description', e.target.value, true)}
                      placeholder="Nhập mô tả chi tiết"
                      className="border-0 p-1 h-7 focus:ring-1 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell className="px-1 py-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssessmentScope(scope.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}