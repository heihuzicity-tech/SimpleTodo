import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronDown, Plus, Edit3, Trash2, FolderOpen } from 'lucide-react';
import { Project } from '../types/kanban';

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project;
  onProjectSwitch: (projectId: string) => void;
  onProjectCreate: (name: string, description?: string) => void;
  onProjectUpdate: (projectId: string, updates: { name?: string; description?: string }) => void;
  onProjectDelete: (projectId: string) => void;
}

export function ProjectSelector({
  projects,
  currentProject,
  onProjectSwitch,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete,
}: ProjectSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreateProject = () => {
    if (formData.name.trim()) {
      onProjectCreate(formData.name.trim(), formData.description.trim() || undefined);
      setFormData({ name: '', description: '' });
      setShowCreateDialog(false);
    }
  };

  const handleEditProject = () => {
    if (editingProject && formData.name.trim()) {
      onProjectUpdate(editingProject.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setFormData({ name: '', description: '' });
      setEditingProject(null);
      setShowEditDialog(false);
    }
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除项目"${project.name}"吗？\n删除后该项目的所有数据将无法恢复。`)) {
      onProjectDelete(project.id);
    }
  };

  const openEditDialog = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '' });
    setShowEditDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 h-8 px-3">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="font-medium">{currentProject.name}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">选择项目</p>
          </div>
          <DropdownMenuSeparator />
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSwitch(project.id)}
              className="flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {project.id === currentProject.id && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => openEditDialog(project, e)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                {projects.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteProject(project, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setFormData({ name: '', description: '' });
              setShowCreateDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            创建新项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
            <DialogDescription>
              为你的新项目设置名称和描述
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">项目名称</Label>
              <Input
                id="project-name"
                placeholder="输入项目名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">项目描述（可选）</Label>
              <Textarea
                id="project-description"
                placeholder="输入项目描述"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateProject} disabled={!formData.name.trim()}>
              创建项目
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
            <DialogDescription>
              修改项目的名称和描述
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project-name">项目名称</Label>
              <Input
                id="edit-project-name"
                placeholder="输入项目名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleEditProject()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-project-description">项目描述（可选）</Label>
              <Textarea
                id="edit-project-description"
                placeholder="输入项目描述"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEditProject} disabled={!formData.name.trim()}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}