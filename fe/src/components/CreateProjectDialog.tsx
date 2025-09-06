import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { api } from "../services/api";
import { Project } from "../types/auth";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
}

export function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  onProjectCreated
}: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    project_name: "",
    system_name: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name.trim()) {
      toast.error("Vui lòng nhập tên dự án");
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.createProject({
        project_name: formData.project_name,
        system_name: formData.system_name
      });
      const newProject: Project = {
        id: result.id || Date.now(),
        name: formData.project_name,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: 1,
        owner: 'current_user'
      };
      setFormData({ project_name: '', system_name: '' });
      if (onProjectCreated) onProjectCreated(newProject);
      onOpenChange(false);
      toast.success('Dự án đã được tạo thành công!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Có lỗi xảy ra khi tạo dự án");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="text-left pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <DialogTitle className="text-lg text-gray-900 dark:text-gray-100">Tạo Dự Án Mới</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Nhập tên và thông tin chi tiết cho dự án mới của bạn
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Tên Dự Án *
            </Label>
            <Input
              id="project-name"
              placeholder="Nhập tên dự án"
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-name" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Tên Hệ Thống
            </Label>
            <Input
              id="system-name"
              placeholder="Nhập tên hệ thống (tùy chọn)"
              value={formData.system_name}
              onChange={(e) => handleInputChange('system_name', e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.project_name.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang tạo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo Dự Án
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}