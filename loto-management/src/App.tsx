import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Users, 
  Settings, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Factory,
  User,
  LogOut,
  Bell,
  Search,
  Pen,
  Zap,
  Waves,
  RotateCcw,
  Cpu,
  Wind,
  ArrowUpDown,
  Blend,
  Flame,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  BellRing,
  AlertCircle,
  Info,
  X,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Equipment {
  id: string;
  name: string;
  location: string;
  type: 'conveyor' | 'press' | 'robotic_arm' | 'hydraulic_press' | 'generator' | 'pump' | 'compressor' | 'crane' | 'mixer' | 'oven';
  status: 'operational' | 'locked_out' | 'maintenance';
  lastLockout?: string;
  assignedTo?: string;
  lockoutReason?: string;
  voltage?: string;
  pressure?: string;
  capacity?: string;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  equipmentId?: string;
  isRead: boolean;
  requiresAction: boolean;
  priority: number; // 1 = highest, 5 = lowest
}

interface LockoutProcedure {
  id: string;
  equipmentId: string;
  title: string;
  steps: string[];
  requiredSignatures: number;
  estimatedTime: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState({ name: "User", role: "Role", id: "U001" });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lockoutProcedures, setLockoutProcedures] = useState<any>({});
  const [analyticsData, setAnalyticsData] = useState<any>({
    lockoutFrequency: { labels: [], datasets: [] },
    equipmentBreakdown: { labels: [], datasets: [] },
    averageDuration: { labels: [], datasets: [] },
    complianceMetrics: { labels: [], datasets: [] },
    alertTrends: { labels: [], datasets: [] },
    responseTime: { labels: [], datasets: [] },
  });

  const fetchData = async () => {
    try {
      const [
        userRes,
        equipmentRes,
        notificationsRes,
        proceduresRes,
        analyticsRes,
      ] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/equipment'),
        fetch('/api/notifications'),
        fetch('/api/procedures'),
        fetch('/api/analytics'),
      ]);

      setCurrentUser(await userRes.json());
      setEquipment(await equipmentRes.json());
      setNotifications(await notificationsRes.json());
      setLockoutProcedures(await proceduresRes.json());
      setAnalyticsData(await analyticsRes.json());
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [lockoutDialogOpen, setLockoutDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [procedureStep, setProcedureStep] = useState(0);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [lockoutReason, setLockoutReason] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [analyticsDateRange, setAnalyticsDateRange] = useState<string>("30d");
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const criticalNotifications = notifications.filter(n => n.type === 'critical' && !n.isRead);
  const actionRequiredNotifications = notifications.filter(n => n.requiresAction && !n.isRead);
  
  const markNotificationAsRead = async (notificationId: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notificationId })
    });
    fetchData(); // Refetch all data for simplicity
  };
  
  const dismissNotification = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
    fetchData();
  };
  
  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    fetchData();
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };
  
  const getNotificationBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-orange-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };
  
  
  const getEquipmentIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'conveyor': return <RotateCcw className="h-5 w-5" />;
      case 'press': return <ArrowUpDown className="h-5 w-5" />;
      case 'robotic_arm': return <Cpu className="h-5 w-5" />;
      case 'hydraulic_press': return <ArrowUpDown className="h-5 w-5" />;
      case 'generator': return <Zap className="h-5 w-5" />;
      case 'pump': return <Waves className="h-5 w-5" />;
      case 'compressor': return <Wind className="h-5 w-5" />;
      case 'crane': return <ArrowUpDown className="h-5 w-5" />;
      case 'mixer': return <Blend className="h-5 w-5" />;
      case 'oven': return <Flame className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };
  
  const getEquipmentColor = (type: Equipment['type']) => {
    switch (type) {
      case 'conveyor': return 'bg-blue-500';
      case 'press': return 'bg-purple-500';
      case 'robotic_arm': return 'bg-cyan-500';
      case 'hydraulic_press': return 'bg-indigo-500';
      case 'generator': return 'bg-yellow-500';
      case 'pump': return 'bg-teal-500';
      case 'compressor': return 'bg-gray-500';
      case 'crane': return 'bg-orange-500';
      case 'mixer': return 'bg-pink-500';
      case 'oven': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const handleLockout = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setProcedureStep(0);
    setSignatureRequired(false);
    setLockoutDialogOpen(true);
  };
  
  const nextStep = () => {
    const currentSteps = getLockoutSteps(selectedEquipment?.type || 'conveyor');
    if (procedureStep < currentSteps.length - 1) {
      setProcedureStep(procedureStep + 1);
    } else {
      setSignatureRequired(true);
    }
  };
  
  const getLockoutSteps = (equipmentType: Equipment['type']) => {
    return lockoutProcedures[equipmentType]?.steps || [];
  };
  
  const getLockoutHazards = (equipmentType: Equipment['type']) => {
    return lockoutProcedures[equipmentType]?.hazards || [];
  };
  
  const getRequiredPPE = (equipmentType: Equipment['type']) => {
    return lockoutProcedures[equipmentType]?.requiredPPE || [];
  };
  
  const completeLockout = async () => {
    if (!selectedEquipment) return;
    await fetch(`/api/equipment/${selectedEquipment.id}/lockout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: lockoutReason, user: currentUser.name })
    });
    setLockoutDialogOpen(false);
    setProcedureStep(0);
    setSignatureRequired(false);
    setLockoutReason("");
    setSelectedEquipment(null);
    fetchData();
  };

  const unlockEquipment = async (equipmentId: string) => {
    await fetch(`/api/equipment/${equipmentId}/unlock`, { method: 'POST' });
    fetchData();
  };

  
  const kpiData = {
    totalLockouts: 154,
    avgDuration: 3.2,
    complianceRate: 97.8,
    incidentsAvoided: 23,
    activeLockouts: equipment.filter(eq => eq.status === 'locked_out').length,
    overdueLockouts: 2
  };
  
  const filteredEquipment = equipment.filter(eq => {
    if (equipmentFilter === "all") return true;
    return eq.type === equipmentFilter;
  });

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'locked_out': return 'bg-red-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      case 'locked_out': return <Lock className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">LOTO Management</h1>
                <p className="text-xs text-muted-foreground">Lockout/Tagout Safety System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search equipment..."
                className="w-64 pl-9"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  {criticalNotifications.length > 0 ? (
                    <BellRing className="h-4 w-4 text-red-500" />
                  ) : unreadNotifications.length > 0 ? (
                    <BellRing className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {unreadNotifications.length} unread
                      {criticalNotifications.length > 0 && (
                        <span className="ml-2 text-red-500 font-medium">
                          • {criticalNotifications.length} critical
                        </span>
                      )}
                    </p>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="h-96">
                  <div className="p-2">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications
                          .sort((a, b) => a.priority - b.priority)
                          .map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border-l-4 ${
                                getNotificationBorderColor(notification.type)
                              } ${
                                !notification.isRead ? 'bg-muted/50' : 'bg-background'
                              } hover:bg-muted/30 transition-colors`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-sm font-medium ${
                                      !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                      {notification.title}
                                    </h4>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {!notification.isRead && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => markNotificationAsRead(notification.id)}
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => dismissNotification(notification.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(notification.timestamp).toLocaleString()}
                                    </span>
                                    {notification.requiresAction && (
                                      <Badge variant="destructive" className="text-xs px-2 py-0">
                                        Action Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.role}</p>
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Procedures
            </TabsTrigger>
            <TabsTrigger value="signatures" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Signatures
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                  <Factory className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{equipment.length}</div>
                  <p className="text-xs text-muted-foreground">Active monitoring</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Locked Out</CardTitle>
                  <Lock className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {equipment.filter(eq => eq.status === 'locked_out').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Safety procedures active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operational</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {equipment.filter(eq => eq.status === 'operational').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Ready for production</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {equipment.filter(eq => eq.status === 'maintenance').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled maintenance</p>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts */}
            {criticalNotifications.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Critical Safety Alerts
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    {criticalNotifications.length} critical alert{criticalNotifications.length > 1 ? 's' : ''} requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {criticalNotifications.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-red-900">{alert.title}</h4>
                              <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                              <p className="text-xs text-red-600 mt-2">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-300 text-red-700 hover:bg-red-100"
                                onClick={() => markNotificationAsRead(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {criticalNotifications.length > 3 && (
                      <div className="text-center">
                        <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                          View {criticalNotifications.length - 3} more critical alerts
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Action Required Alerts */}
            {actionRequiredNotifications.length > 0 && criticalNotifications.length === 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Action Required
                  </CardTitle>
                  <CardDescription className="text-orange-600">
                    {actionRequiredNotifications.length} item{actionRequiredNotifications.length > 1 ? 's' : ''} requiring your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actionRequiredNotifications.slice(0, 2).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-orange-900">{alert.title}</h4>
                              <p className="text-sm text-orange-700 mt-1">{alert.message}</p>
                              <p className="text-xs text-orange-600 mt-2">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-orange-300 text-orange-700 hover:bg-orange-100"
                              onClick={() => markNotificationAsRead(alert.id)}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent LOTO Activity</CardTitle>
                <CardDescription>Latest lockout/tagout procedures and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Air Compressor #2 Locked Out</p>
                      <p className="text-sm text-muted-foreground">Filter replacement procedure initiated by David Chen</p>
                    </div>
                    <div className="text-sm text-muted-foreground">07:15 AM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Unlock className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Centrifugal Pump #3 Unlocked</p>
                      <p className="text-sm text-muted-foreground">Seal replacement completed, returned to operation</p>
                    </div>
                    <div className="text-sm text-muted-foreground">06:45 AM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Generator Safety Check</p>
                      <p className="text-sm text-muted-foreground">Emergency generator #1 scheduled for monthly inspection</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Yesterday</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Equipment Management</h2>
                <p className="text-muted-foreground">
                  Monitor and manage all industrial equipment 
                  {equipmentFilter !== "all" && (
                    <span className="ml-2">
                      • Showing {filteredEquipment.length} of {equipment.length} items
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    <SelectItem value="conveyor">Conveyors</SelectItem>
                    <SelectItem value="press">Presses</SelectItem>
                    <SelectItem value="robotic_arm">Robotic Arms</SelectItem>
                    <SelectItem value="hydraulic_press">Hydraulic Presses</SelectItem>
                    <SelectItem value="generator">Generators</SelectItem>
                    <SelectItem value="pump">Pumps</SelectItem>
                    <SelectItem value="compressor">Compressors</SelectItem>
                    <SelectItem value="crane">Cranes</SelectItem>
                    <SelectItem value="mixer">Mixers</SelectItem>
                    <SelectItem value="oven">Ovens</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {filteredEquipment.map((eq) => (
                <Card key={eq.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${eq.status === 'operational' ? getEquipmentColor(eq.type) : eq.status === 'locked_out' ? 'bg-red-500' : 'bg-orange-500'}`}>
                          {eq.status === 'operational' ? getEquipmentIcon(eq.type) : getStatusIcon(eq.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{eq.name}</h3>
                          <p className="text-sm text-muted-foreground">{eq.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={eq.status === 'operational' ? 'default' : eq.status === 'locked_out' ? 'destructive' : 'secondary'}>
                              {eq.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{eq.type.replace('_', ' ').toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground">ID: {eq.id}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {eq.voltage && <span>• {eq.voltage}</span>}
                            {eq.pressure && <span>• {eq.pressure}</span>}
                            {eq.capacity && <span>• {eq.capacity}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {eq.status === 'operational' ? (
                          <Dialog open={lockoutDialogOpen && selectedEquipment?.id === eq.id} onOpenChange={(open) => {
                            if (!open) {
                              setLockoutDialogOpen(false);
                              setSelectedEquipment(null);
                              setProcedureStep(0);
                              setSignatureRequired(false);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="flex items-center gap-2"
                                onClick={() => handleLockout(eq)}
                              >
                                <Lock className="h-4 w-4" />
                                Lock Out
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Lock className="h-5 w-5 text-red-500" />
                                  Lockout Procedure: {selectedEquipment?.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Follow the safety procedure step by step. All steps must be completed and verified.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {!signatureRequired ? (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                      {procedureStep + 1}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">Step {procedureStep + 1} of {getLockoutSteps(selectedEquipment?.type || 'conveyor').length}</p>
                                      <p className="text-sm text-muted-foreground">{getLockoutSteps(selectedEquipment?.type || 'conveyor')[procedureStep]}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm">
                                      <strong>Equipment:</strong> {selectedEquipment?.name}<br/>
                                      <strong>Type:</strong> {selectedEquipment?.type?.replace('_', ' ').toUpperCase()}<br/>
                                      <strong>Location:</strong> {selectedEquipment?.location}<br/>
                                      {selectedEquipment?.voltage && (<><strong>Voltage:</strong> {selectedEquipment.voltage}<br/></>)}
                                      {selectedEquipment?.pressure && (<><strong>Pressure:</strong> {selectedEquipment.pressure}<br/></>)}
                                      {selectedEquipment?.capacity && (<><strong>Capacity:</strong> {selectedEquipment.capacity}<br/></>)}
                                      <strong>Initiated by:</strong> {currentUser.name} ({currentUser.id})
                                    </p>
                                  </div>
                                  
                                  {/* Safety Information */}
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border p-3">
                                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        Key Hazards
                                      </h4>
                                      <ul className="text-xs text-muted-foreground space-y-1">
                                        {getLockoutHazards(selectedEquipment?.type || 'conveyor').map((hazard, i) => (
                                          <li key={i}>• {hazard}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="rounded-lg border p-3">
                                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                        Required PPE
                                      </h4>
                                      <ul className="text-xs text-muted-foreground space-y-1">
                                        {getRequiredPPE(selectedEquipment?.type || 'conveyor').map((ppe, i) => (
                                          <li key={i}>• {ppe}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  {procedureStep === getLockoutSteps(selectedEquipment?.type || 'conveyor').length - 1 && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Lockout Reason</label>
                                      <Textarea 
                                        placeholder="Enter the reason for lockout (e.g., scheduled maintenance, repairs, etc.)"
                                        value={lockoutReason}
                                        onChange={(e) => setLockoutReason(e.target.value)}
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    {Array.from({ length: getLockoutSteps(selectedEquipment?.type || 'conveyor').length }, (_, i) => (
                                      <div
                                        key={i}
                                        className={`h-2 flex-1 rounded ${
                                          i <= procedureStep ? 'bg-primary' : 'bg-muted'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  <div className="text-center">
                                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                    <h3 className="mt-2 text-lg font-medium">Procedure Complete</h3>
                                    <p className="text-sm text-muted-foreground">All safety steps have been completed. Signature required to finalize lockout.</p>
                                  </div>
                                  
                                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                                    <Pen className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">Digital signature capture area</p>
                                    <p className="text-xs text-muted-foreground">Click and drag to sign</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Authorization Code</label>
                                    <Input placeholder="Enter your authorization code" type="password" />
                                  </div>
                                </div>
                              )}
                              
                              <DialogFooter>
                                {!signatureRequired ? (
                                  <div className="flex w-full justify-between">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setLockoutDialogOpen(false);
                                        setSelectedEquipment(null);
                                        setProcedureStep(0);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={nextStep}
                                      disabled={procedureStep === getLockoutSteps(selectedEquipment?.type || 'conveyor').length - 1 && !lockoutReason.trim()}
                                    >
                                      {procedureStep === getLockoutSteps(selectedEquipment?.type || 'conveyor').length - 1 ? 'Complete Steps' : 'Next Step'}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex w-full justify-between">
                                    <Button variant="outline" onClick={() => setSignatureRequired(false)}>
                                      Back to Steps
                                    </Button>
                                    <Button onClick={completeLockout} className="bg-red-600 hover:bg-red-700">
                                      Finalize Lockout
                                    </Button>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : eq.status === 'locked_out' ? (
                          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => unlockEquipment(eq.id)}>
                            <Unlock className="h-4 w-4" />
                            Unlock
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {eq.status === 'locked_out' && eq.assignedTo && (
                      <div className="mt-4 rounded-lg bg-muted p-3">
                        <div className="text-sm">
                          <p><strong>Assigned to:</strong> {eq.assignedTo}</p>
                          <p><strong>Reason:</strong> {eq.lockoutReason}</p>
                          <p><strong>Locked since:</strong> {eq.lastLockout}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Procedures Tab */}
          <TabsContent value="procedures" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Safety Procedures</h2>
                <p className="text-muted-foreground">Step-by-step lockout/tagout procedures</p>
              </div>
              <Button className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create Procedure
              </Button>
            </div>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <RotateCcw className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Conveyor Belt Lockout Procedure</CardTitle>
                        <CardDescription>Standard procedure for conveyor belt maintenance</CardDescription>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockoutProcedures.conveyor.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">{index + 1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>• Equipment Type: Conveyor Belt</span>
                    <span>• Required Signatures: 2</span>
                    <span>• Est. Time: 15 minutes</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                        <Zap className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle>Generator Lockout Procedure</CardTitle>
                        <CardDescription>Safety procedure for emergency generator maintenance</CardDescription>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockoutProcedures.generator.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">{index + 1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>• Equipment Type: Generator</span>
                    <span>• Required Signatures: 3</span>
                    <span>• Est. Time: 30 minutes</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        <Waves className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle>Pump Lockout Procedure</CardTitle>
                        <CardDescription>Safety procedure for centrifugal pump maintenance</CardDescription>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockoutProcedures.pump.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">{index + 1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>• Equipment Type: Pump</span>
                    <span>• Required Signatures: 2</span>
                    <span>• Est. Time: 20 minutes</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Wind className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle>Compressor Lockout Procedure</CardTitle>
                        <CardDescription>Safety procedure for air compressor maintenance</CardDescription>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockoutProcedures.compressor.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">{index + 1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>• Equipment Type: Compressor</span>
                    <span>• Required Signatures: 2</span>
                    <span>• Est. Time: 25 minutes</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Signatures Tab */}
          <TabsContent value="signatures" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Digital Signatures</h2>
                <p className="text-muted-foreground">Authorize and validate safety procedures</p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Authorizations</CardTitle>
                  <CardDescription>Procedures awaiting signature approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Press Machine #3 Lockout</p>
                        <p className="text-sm text-muted-foreground">Initiated by: Mike Johnson</p>
                        <p className="text-sm text-muted-foreground">Time: 09:30 AM</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">1/2 Signatures</Badge>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Approve
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Robotic Arm #2 Unlock</p>
                        <p className="text-sm text-muted-foreground">Initiated by: Sarah Wilson</p>
                        <p className="text-sm text-muted-foreground">Time: 10:15 AM</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">0/3 Signatures</Badge>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Signature Validation</CardTitle>
                  <CardDescription>Digital signature capture and verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                      <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to capture digital signature</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Authorizing Officer</label>
                      <Input placeholder="Enter full name" value={currentUser.name} readOnly />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee ID</label>
                      <Input placeholder="Enter employee ID" value={currentUser.id} readOnly />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Authorization Code</label>
                      <Input placeholder="Enter security code" type="password" />
                    </div>
                    
                    <Button className="w-full">
                      Validate Signature
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Signatures</CardTitle>
                <CardDescription>History of authorized procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">Conveyor Belt #2 Unlock Authorization</p>
                      <p className="text-sm text-muted-foreground">Signed by: John Smith • 08:15 AM</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">Press Machine #1 Lockout Authorization</p>
                      <p className="text-sm text-muted-foreground">Signed by: David Chen • Yesterday 4:30 PM</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">Robotic Arm #1 Maintenance Authorization</p>
                      <p className="text-sm text-muted-foreground">Signed by: Lisa Garcia • Yesterday 2:15 PM</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Safety Analytics</h2>
                <p className="text-muted-foreground">Comprehensive insights into LOTO operations and compliance</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={analyticsDateRange} onValueChange={setAnalyticsDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Lockouts</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.totalLockouts}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avgDuration}h</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">-8%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.complianceRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+2%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Lockouts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{kpiData.activeLockouts}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Incidents Avoided</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{kpiData.incidentsAvoided}</div>
                  <p className="text-xs text-muted-foreground">Through proper LOTO</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{kpiData.overdueLockouts}</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Lockout Frequency Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lockout Activity Trends
                  </CardTitle>
                  <CardDescription>
                    Weekly lockout initiation and completion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar 
                      data={analyticsData.lockoutFrequency}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 5
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Equipment Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Equipment Type Distribution
                  </CardTitle>
                  <CardDescription>
                    Lockout frequency by equipment type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Doughnut 
                        data={analyticsData.equipmentBreakdown}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Average Duration Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Average Lockout Duration
                  </CardTitle>
                  <CardDescription>
                    Mean duration by equipment type (hours)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar 
                      data={analyticsData.averageDuration}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Hours'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Compliance Metrics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Compliance Rate Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly safety compliance percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line 
                      data={analyticsData.complianceMetrics}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                        },
                        scales: {
                          y: {
                            min: 90,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Compliance %'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Alert Analytics Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Alert Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    Safety Alert Trends
                  </CardTitle>
                  <CardDescription>
                    Weekly alert frequency by severity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar 
                      data={analyticsData.alertTrends}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          x: {
                            stacked: true,
                          },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: {
                              stepSize: 2
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Alert Response Times
                  </CardTitle>
                  <CardDescription>
                    Average time to respond to alerts by priority
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Doughnut 
                        data={analyticsData.responseTime}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Alert Statistics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Current Alert Status
                </CardTitle>
                <CardDescription>
                  Real-time overview of active alerts and response metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{criticalNotifications.length}</div>
                    <div className="text-sm text-red-700">Critical Alerts</div>
                    <div className="text-xs text-red-600 mt-1">Require immediate action</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">
                      {notifications.filter(n => n.type === 'warning' && !n.isRead).length}
                    </div>
                    <div className="text-sm text-orange-700">Warning Alerts</div>
                    <div className="text-xs text-orange-600 mt-1">Need attention soon</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {notifications.filter(n => n.type === 'info' && !n.isRead).length}
                    </div>
                    <div className="text-sm text-blue-700">Info Alerts</div>
                    <div className="text-xs text-blue-600 mt-1">Informational updates</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {(((notifications.length - unreadNotifications.length) / notifications.length) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">Response Rate</div>
                    <div className="text-xs text-green-600 mt-1">Alerts acknowledged</div>
                  </div>
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Overdue Equipment
                    </h4>
                    <div className="space-y-2">
                      {equipment.filter(eq => eq.status === 'locked_out').map(eq => {
                        const lockoutTime = new Date(eq.lastLockout || '');
                        const hoursSince = Math.floor((Date.now() - lockoutTime.getTime()) / (1000 * 60 * 60));
                        const isOverdue = hoursSince > 8; // Consider overdue after 8 hours
                        
                        return isOverdue ? (
                          <div key={eq.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                            <div>
                              <p className="font-medium text-sm text-red-900">{eq.name}</p>
                              <p className="text-xs text-red-700">{eq.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-600">{hoursSince}h</p>
                              <p className="text-xs text-red-600">overdue</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                      {!equipment.some(eq => {
                        if (eq.status !== 'locked_out' || !eq.lastLockout) return false;
                        const hoursSince = Math.floor((Date.now() - new Date(eq.lastLockout).getTime()) / (1000 * 60 * 60));
                        return hoursSince > 8;
                      }) && (
                        <div className="text-center p-4 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm">All lockouts are on schedule</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Alert Performance
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-medium">12 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Alert Resolution Rate</span>
                        <span className="font-medium text-green-600">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">False Positive Rate</span>
                        <span className="font-medium text-orange-600">2.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Escalation Rate</span>
                        <span className="font-medium text-red-600">1.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics Tables */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Equipment</CardTitle>
                  <CardDescription>Lowest average lockout duration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <ArrowUpDown className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Overhead Crane #1</p>
                          <p className="text-xs text-muted-foreground">Heavy Assembly Bay</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">1.8h</p>
                        <p className="text-xs text-green-600">-15% vs avg</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <Wind className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Air Compressor #2</p>
                          <p className="text-xs text-muted-foreground">Utility Room</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">2.1h</p>
                        <p className="text-xs text-green-600">-12% vs avg</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Conveyor Belt #1</p>
                          <p className="text-xs text-muted-foreground">Production Line A</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">2.5h</p>
                        <p className="text-xs text-green-600">-8% vs avg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Safety Alerts</CardTitle>
                  <CardDescription>Critical incidents and near misses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Temperature Warning</p>
                        <p className="text-xs text-muted-foreground">Generator #1 - High temperature detected</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Overdue Lockout</p>
                        <p className="text-xs text-muted-foreground">Mixer #3 - Exceeding planned duration</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Compliance Check</p>
                        <p className="text-xs text-muted-foreground">All procedures completed successfully</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Audit Trail</h2>
                <p className="text-muted-foreground">Complete history of all LOTO activities</p>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Search audit logs..." className="w-64" />
                <Button variant="outline">Export</Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Chronological record of all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">LOCKOUT INITIATED</p>
                        <span className="text-sm text-muted-foreground">2024-07-29 09:30:15</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Equipment: Press Machine #3 (Hydraulic Press)</p>
                      <p className="text-sm text-muted-foreground">User: Mike Johnson (MJ002)</p>
                      <p className="text-sm text-muted-foreground">Reason: Monthly maintenance</p>
                      <p className="text-sm text-muted-foreground">Procedure: HYDRAULIC-PRESS-001</p>
                      <p className="text-sm text-muted-foreground">IP Address: 192.168.1.45</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">LOCKOUT INITIATED</p>
                        <span className="text-sm text-muted-foreground">2024-07-29 07:15:30</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Equipment: Air Compressor #2</p>
                      <p className="text-sm text-muted-foreground">User: David Chen (DC004)</p>
                      <p className="text-sm text-muted-foreground">Reason: Filter replacement</p>
                      <p className="text-sm text-muted-foreground">Procedure: COMPRESSOR-001</p>
                      <p className="text-sm text-muted-foreground">IP Address: 192.168.1.67</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">SIGNATURE CAPTURED</p>
                        <span className="text-sm text-muted-foreground">2024-07-29 09:32:20</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Procedure: Press Machine #3 Lockout</p>
                      <p className="text-sm text-muted-foreground">Signatory: John Smith (JS001)</p>
                      <p className="text-sm text-muted-foreground">Role: Safety Supervisor</p>
                      <p className="text-sm text-muted-foreground">Signature Hash: 7a8b9c2d...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Unlock className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">EQUIPMENT UNLOCKED</p>
                        <span className="text-sm text-muted-foreground">2024-07-29 06:45:15</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Equipment: Centrifugal Pump #4</p>
                      <p className="text-sm text-muted-foreground">User: Sarah Wilson (SW003)</p>
                      <p className="text-sm text-muted-foreground">Maintenance Duration: 2h 15m</p>
                      <p className="text-sm text-muted-foreground">Work Completed: Seal replacement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">SAFETY ALERT</p>
                        <span className="text-sm text-muted-foreground">2024-07-28 16:45:10</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Equipment: Emergency Generator #1</p>
                      <p className="text-sm text-muted-foreground">Alert: High temperature warning during operation</p>
                      <p className="text-sm text-muted-foreground">User: System Automatic</p>
                      <p className="text-sm text-muted-foreground">Action: Cooling system inspection required</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">PROCEDURE UPDATE</p>
                        <span className="text-sm text-muted-foreground">2024-07-28 14:20:00</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Equipment Type: Overhead Crane</p>
                      <p className="text-sm text-muted-foreground">Action: Updated lockout procedure CRANE-001</p>
                      <p className="text-sm text-muted-foreground">Updated by: Lisa Garcia (LG005)</p>
                      <p className="text-sm text-muted-foreground">Changes: Added mechanical brake verification step</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
