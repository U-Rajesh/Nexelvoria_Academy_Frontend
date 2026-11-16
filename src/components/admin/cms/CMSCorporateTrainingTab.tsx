import React, { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  Users,
  TrendingUp,
  Wrench,
  Sliders,
  GraduationCap,
  Briefcase,
  Code,
  Terminal,
  Cpu,
  Layers,
  Globe,
  ShieldCheck,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  Sparkles,
  Building2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Modal } from '../../feedback/Modal';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type CorporateTrainingService,
  type CorporateTrainingConfig,
} from '../../../services/cmsService';

const PRESET_ICONS = [
  { name: 'Laptop', label: 'Technical / Laptop', icon: Laptop },
  { name: 'Users', label: 'People / Soft Skills', icon: Users },
  { name: 'TrendingUp', label: 'Growth / Skill Development', icon: TrendingUp },
  { name: 'Wrench', label: 'Tools / Workshops', icon: Wrench },
  { name: 'Sliders', label: 'Custom / Tailored', icon: Sliders },
  { name: 'GraduationCap', label: 'Academy / Internship', icon: GraduationCap },
  { name: 'Code', label: 'Code & Stacks', icon: Code },
  { name: 'Terminal', label: 'Terminal / CLI', icon: Terminal },
  { name: 'Cpu', label: 'Hardware / Systems', icon: Cpu },
  { name: 'Layers', label: 'Architecture / Fullstack', icon: Layers },
  { name: 'Briefcase', label: 'Enterprise / Career', icon: Briefcase },
  { name: 'ShieldCheck', label: 'Security / Compliance', icon: ShieldCheck },
  { name: 'Globe', label: 'Global / Cloud', icon: Globe },
  { name: 'Sparkles', label: 'AI / Innovation', icon: Sparkles },
];

const SUGGESTED_TOPICS = [
  'Java',
  'Python',
  'React.js',
  'Node.js',
  '.NET',
  'Microservices',
  'Cloud Architecture',
  'Communication skills',
  'Teamwork',
  'Leadership',
  'Presentation skills',
  'System Design',
  'DevOps & CI/CD',
  'GenAI Tools',
  'Docker & Kubernetes',
  'Interview preparation',
  'Job-readiness training',
];

export const CMSCorporateTrainingTab: React.FC = () => {
  const [config, setConfig] = useState<CorporateTrainingConfig>(() => cmsService.getCorporateTraining());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<CorporateTrainingService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [editingService, setEditingService] = useState<CorporateTrainingService | null>(null);
  const [iconMode, setIconMode] = useState<'system' | 'custom'>('system');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Corporate Clients State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);

  const { showToast } = useNotification();

  // Load and subscribe to cross-panel updates
  const reloadData = () => {
    setConfig(cmsService.getCorporateTraining());
  };

  useEffect(() => {
    window.addEventListener('cms-update', reloadData);
    window.addEventListener('app-storage-update', reloadData);
    return () => {
      window.removeEventListener('cms-update', reloadData);
      window.removeEventListener('app-storage-update', reloadData);
    };
  }, []);

  const services = useMemo(() => {
    return Array.isArray(config.services)
      ? [...config.services].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      : [];
  }, [config.services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.topics && s.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.status === 'active') ||
        (statusFilter === 'inactive' && s.status === 'inactive');

      return matchSearch && matchStatus;
    });
  }, [services, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.status === 'active').length;
    const inactive = total - active;
    const allTopics = new Set(services.flatMap((s) => s.topics || []));
    return { total, active, inactive, distinctTopics: allTopics.size };
  }, [services]);

  // --- Handlers: Modal Open / Close ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setValidationErrors({});
    setNewTopicInput('');
    setIconMode('system');
    setEditingService({
      id: `corp-service-${Date.now()}`,
      title: '',
      shortDescription: '',
      fullDescription: '',
      topics: [],
      icon: 'Laptop',
      displayOrder: services.length + 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (service: CorporateTrainingService) => {
    setIsEditing(true);
    setValidationErrors({});
    setNewTopicInput('');
    setIconMode(service.icon?.startsWith('data:') || service.icon?.startsWith('http') ? 'custom' : 'system');
    setEditingService({ ...service, topics: [...(service.topics || [])] });
    setModalOpen(true);
  };

  // --- Handlers: Topic Tag Management ---
  const handleAddTopic = () => {
    if (!newTopicInput.trim() || !editingService) return;
    const trimmed = newTopicInput.trim();
    if (!editingService.topics.includes(trimmed)) {
      setEditingService({
        ...editingService,
        topics: [...editingService.topics, trimmed],
      });
      if (validationErrors.topics) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next.topics;
          return next;
        });
      }
    }
    setNewTopicInput('');
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    if (!editingService) return;
    setEditingService({
      ...editingService,
      topics: editingService.topics.filter((t) => t !== topicToRemove),
    });
  };

  // --- Handlers: Image Downscaling for Custom Logo/Image ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast({
        type: 'warning',
        title: 'File Too Large',
        message: 'Please choose an image under 2MB.',
      });
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgUrl = event.target?.result as string;
        setEditingService({ ...editingService, icon: svgUrl });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.82);
          setEditingService({ ...editingService, icon: compressedDataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Handlers: Form Submission & Validation ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const errors: Record<string, string> = {};
    if (!editingService.title.trim()) {
      errors.title = 'Service title is required.';
    }
    if (!editingService.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required.';
    }
    if (!editingService.topics || editingService.topics.length === 0) {
      errors.topics = 'Please add at least one topic or technology.';
    }
    if (!editingService.displayOrder || editingService.displayOrder < 1) {
      errors.displayOrder = 'Display order must be 1 or greater.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please resolve the highlighted form errors before saving.',
      });
      return;
    }

    setIsSaving(true);
    const result = cmsService.saveCorporateTrainingService(editingService);
    setIsSaving(false);

    if (result.success) {
      showToast({
        type: 'success',
        title: isEditing ? 'Service Updated' : 'Service Created',
        message: result.message || `Corporate training service "${editingService.title}" saved successfully.`,
      });
      setModalOpen(false);
      setEditingService(null);
      reloadData();
    } else {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: result.error || 'Failed to save corporate training service.',
      });
    }
  };

  // --- Handlers: Toggle Status ---
  const handleToggleStatus = (id: string, currentTitle: string) => {
    const result = cmsService.toggleCorporateTrainingServiceStatus(id);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Status Updated',
        message: result.message || `Status for "${currentTitle}" updated successfully.`,
      });
      reloadData();
    } else {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: result.error || 'Failed to toggle service status.',
      });
    }
  };

  // --- Handlers: Delete Service ---
  const handleConfirmDelete = () => {
    if (!serviceToDelete) return;
    const result = cmsService.deleteCorporateTrainingService(serviceToDelete.id);
    if (result.success) {
      showToast({
        type: 'info',
        title: 'Service Removed',
        message: result.message || `Service "${serviceToDelete.title}" was removed.`,
      });
      setDeleteModalOpen(false);
      setServiceToDelete(null);
      reloadData();
    } else {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: result.error || 'Failed to delete service.',
      });
    }
  };

  // --- Handlers: Reordering ---
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newOrder = [...services];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const reorderedIds = newOrder.map((s) => s.id);
    const result = cmsService.reorderCorporateTrainingServices(reorderedIds);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Order Updated',
        message: 'Corporate training services display sequence updated.',
      });
      reloadData();
    } else {
      showToast({
        type: 'error',
        title: 'Reorder Failed',
        message: result.error || 'Failed to update order.',
      });
    }
  };

  // --- Handlers: Corporate Clients Roster ---
  const handleOpenAddClient = () => {
    setEditingClient({
      id: `client-${Date.now()}`,
      name: '',
      logoUrl: '',
    });
    setClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim()) return;

    const currentClients = Array.isArray(config.clients) ? [...config.clients] : [];
    const idx = currentClients.findIndex(
      (c) => (c.name || c.companyName)?.toLowerCase() === editingClient.name.trim().toLowerCase()
    );
    if (idx >= 0) {
      currentClients[idx] = {
        ...currentClients[idx],
        name: editingClient.name.trim(),
        companyName: editingClient.name.trim(),
      };
    } else {
      currentClients.push({
        id: editingClient.id,
        name: editingClient.name.trim(),
        companyName: editingClient.name.trim(),
        isVisible: true,
      });
    }

    const updated = { ...config, clients: currentClients };
    cmsService.saveCorporateTraining(updated);
    setConfig(updated);
    setClientModalOpen(false);
    showToast({
      type: 'success',
      title: 'Corporate Client Saved',
      message: `${editingClient.name} added to enterprise clients roster.`,
    });
  };

  const handleDeleteClient = (name: string) => {
    const currentClients = Array.isArray(config.clients) ? [...config.clients] : [];
    const updated = {
      ...config,
      clients: currentClients.filter((c) => (c.name || c.companyName) !== name),
    };
    cmsService.saveCorporateTraining(updated);
    setConfig(updated);
    showToast({
      type: 'info',
      title: 'Client Removed',
      message: `${name} removed from enterprise clients roster.`,
    });
  };

  // Helper to render icon for a service
  const renderIcon = (iconIdentifier: string) => {
    if (iconIdentifier?.startsWith('data:') || iconIdentifier?.startsWith('http')) {
      return (
        <img
          src={iconIdentifier}
          alt="Icon"
          className="h-7 w-7 object-contain rounded-md"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    const match = PRESET_ICONS.find((p) => p.name === iconIdentifier);
    const IconComp = match ? match.icon : Laptop;
    return <IconComp className="h-6 w-6 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-indigo-600">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Services</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Publicly</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
        </Card>
        <Card className="p-4 border-l-4 border-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive / Hidden</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.inactive}</p>
        </Card>
        <Card className="p-4 border-l-4 border-sky-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distinct Topics</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.distinctTopics}</p>
        </Card>
      </div>

      {/* Control Bar: Search, Filters & Add Action */}
      <Card className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services by title, description, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({stats.inactive})
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shrink-0"
        >
          Add Corporate Service
        </Button>
      </Card>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <Card className="p-12 text-center space-y-3 border-dashed border-2 border-slate-200">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Corporate Training Services Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No services match your active search filter. Clear the query to see all programs.'
                : 'No corporate services available. Click "Add Corporate Service" to create one.'}
            </p>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search Filter
              </Button>
            )}
          </Card>
        ) : (
          filteredServices.map((service) => {
            const originalIndex = services.findIndex((s) => s.id === service.id);
            const isFirst = originalIndex === 0;
            const isLast = originalIndex === services.length - 1;

            return (
              <Card
                key={service.id}
                className={`p-4 transition-all duration-150 hover:shadow-md border ${
                  service.status === 'active' ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Icon & Service Main Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Icon container */}
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      {renderIcon(service.icon)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                          #{service.displayOrder}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{service.title}</h4>
                        <Badge
                          variant={service.status === 'active' ? 'success' : 'neutral'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {service.status === 'active' ? 'Active on Website' : 'Inactive / Hidden'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {service.shortDescription}
                      </p>

                      {/* Topic Tags */}
                      {service.topics && service.topics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {service.topics.map((topic, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 text-[11px] rounded-md bg-indigo-50/80 text-indigo-700 border border-indigo-100/60 font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Display Order Shift */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    {/* Move Up / Down */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-1">
                      <button
                        type="button"
                        onClick={() => handleMove(originalIndex, 'up')}
                        disabled={isFirst}
                        title="Move Higher in Display Sequence"
                        className={`p-1.5 transition-colors ${
                          isFirst ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(originalIndex, 'down')}
                        disabled={isLast}
                        title="Move Lower in Display Sequence"
                        className={`p-1.5 transition-colors border-l border-slate-200 ${
                          isLast ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Toggle Status */}
                    <Button
                      variant={service.status === 'active' ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleStatus(service.id, service.title)}
                      leftIcon={service.status === 'active' ? <EyeOff className="h-3.5 w-3.5 text-amber-600" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                      className="text-xs"
                    >
                      {service.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(service)}
                      leftIcon={<Edit className="h-3.5 w-3.5" />}
                      className="text-xs"
                    >
                      Edit
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setServiceToDelete(service);
                        setDeleteModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5"
                      title="Delete Service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Corporate Clients & Enterprise Roster */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Corporate Clients & Enterprise Roster</h3>
            <p className="text-xs text-slate-500">
              Trusted enterprise partners displayed on the corporate training public portal ({config.clients?.length || 0} Companies).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddClient}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Enterprise Client
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(!config.clients || config.clients.length === 0) ? (
            <p className="text-xs text-slate-400 italic col-span-full py-2">No enterprise clients added yet.</p>
          ) : (
            config.clients.map((cli, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">{cli.name || cli.companyName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteClient(cli.name || cli.companyName || '')}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                  title="Remove Client"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* --- ADD / EDIT SERVICE MODAL --- */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSaving && setModalOpen(false)}
        title={isEditing ? 'Edit Corporate Training Service' : 'Add Corporate Training Service'}
      >
        {editingService && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Service Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingService.title}
                onChange={(e) => {
                  setEditingService({ ...editingService, title: e.target.value });
                  if (validationErrors.title) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.title;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. Technical Training, Corporate Workshops"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  validationErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {validationErrors.title && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.title}
                </p>
              )}
            </div>

            {/* Short Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Short Description (Overview) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={editingService.shortDescription}
                onChange={(e) => {
                  setEditingService({ ...editingService, shortDescription: e.target.value });
                  if (validationErrors.shortDescription) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.shortDescription;
                      return next;
                    });
                  }
                }}
                placeholder="Concise 1-2 sentence description for the service card..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  validationErrors.shortDescription ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {validationErrors.shortDescription && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.shortDescription}
                </p>
              )}
            </div>

            {/* Full Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Detailed Description
              </label>
              <textarea
                rows={3}
                value={editingService.fullDescription}
                onChange={(e) => setEditingService({ ...editingService, fullDescription: e.target.value })}
                placeholder="Detailed curriculum breakdown, delivery methods, or corporate value propositions..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Topics / Technologies Manager */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Topics & Technologies <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  placeholder="e.g. Java, Python, Leadership, Microservices..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTopic}>
                  Add Topic
                </Button>
              </div>

              {/* Current Topics List */}
              <div className="min-h-[42px] p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 items-center">
                {editingService.topics.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px]">No topics added yet. Add at least one topic above.</span>
                ) : (
                  editingService.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="hover:text-rose-600 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {validationErrors.topics && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.topics}
                </p>
              )}

              {/* Quick suggestions */}
              <div className="mt-2 flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Suggestions:</span>
                {SUGGESTED_TOPICS.filter((st) => !editingService.topics.includes(st)).slice(0, 8).map((st, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      setEditingService({ ...editingService, topics: [...editingService.topics, st] });
                      if (validationErrors.topics) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.topics;
                          return next;
                        });
                      }
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 transition-colors"
                  >
                    + {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon & Asset Mode Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">Icon / Visual Asset</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIconMode('system')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    iconMode === 'system'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  System Icon Preset
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode('custom')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    iconMode === 'custom'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Custom Upload / URL
                </button>
              </div>

              {iconMode === 'system' ? (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-lg">
                  {PRESET_ICONS.map((preset) => {
                    const IconComp = preset.icon;
                    const isSelected = editingService.icon === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, icon: preset.name })}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                        title={preset.label}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-[9px] font-bold truncate max-w-full">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Upload Custom Graphic / Logo (Auto-compressed to ~10KB)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Direct Image URL</label>
                    <input
                      type="url"
                      value={editingService.icon.startsWith('http') ? editingService.icon : ''}
                      onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                      placeholder="https://example.com/icon.svg"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  {/* Image preview */}
                  {(editingService.icon.startsWith('data:') || editingService.icon.startsWith('http')) && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-500">Preview:</span>
                      <img src={editingService.icon} alt="Preview" className="h-8 w-8 object-contain rounded border border-slate-200 bg-white" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Display Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={editingService.displayOrder}
                  onChange={(e) =>
                    setEditingService({ ...editingService, displayOrder: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Publishing Status</label>
                <select
                  value={editingService.status}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="active">Active (Visible on Website)</option>
                  <option value="inactive">Inactive (Hidden from Website)</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Service'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- CONFIRM DELETE MODAL --- */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Service Deletion"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete the corporate training service{' '}
            <strong className="text-slate-900">{serviceToDelete?.title}</strong>?
          </p>
          <p className="text-slate-500 text-[11px]">
            This action will remove the service from Admin, Super Admin, and the Public Website immediately.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete} leftIcon={<Trash2 className="h-4 w-4" />}>
              Yes, Delete Service
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- ADD CLIENT MODAL --- */}
      <Modal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        title="Add Corporate Client"
      >
        {editingClient && (
          <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Enterprise Name *</label>
              <input
                type="text"
                required
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                placeholder="e.g. Infosys, Wipro, Tech Mahindra"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setClientModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Client
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
