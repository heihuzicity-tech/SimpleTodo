import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Project } from '../types/kanban';

const defaultProjects: Project[] = [
  {
    id: 'personal-notes',
    name: '个人备忘',
    description: '个人任务和备忘录',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'work-project',
    name: '工作项目',
    description: '工作相关任务管理',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'learning',
    name: '学习计划',
    description: '学习和技能提升相关',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function useProjectStore() {
  const [projects, setProjects] = useLocalStorage<Project[]>('kanban-projects', defaultProjects);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string>('kanban-current-project', 'personal-notes');

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const createProject = useCallback((name: string, description?: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    return newProject;
  }, [setProjects, setCurrentProjectId]);

  const updateProject = useCallback((projectId: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      )
    );
  }, [setProjects]);

  const deleteProject = useCallback((projectId: string) => {
    if (projects.length <= 1) {
      alert('至少需要保留一个项目');
      return false;
    }

    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return false;

    // If deleting current project, switch to another one
    if (projectId === currentProjectId) {
      const remainingProjects = projects.filter(p => p.id !== projectId);
      setCurrentProjectId(remainingProjects[0].id);
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // Clear the board data for the deleted project
    localStorage.removeItem(`kanban-board-${projectId}`);
    localStorage.removeItem(`kanban-activities-${projectId}`);
    
    return true;
  }, [projects, currentProjectId, setProjects, setCurrentProjectId]);

  const switchProject = useCallback((projectId: string) => {
    if (projects.find(p => p.id === projectId)) {
      setCurrentProjectId(projectId);
    }
  }, [projects, setCurrentProjectId]);

  return {
    projects,
    currentProject,
    currentProjectId,
    createProject,
    updateProject,
    deleteProject,
    switchProject,
  };
}