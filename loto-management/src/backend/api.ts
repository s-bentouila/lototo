import { Hono } from 'hono'

// --- Data Structures ---
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
  priority: number;
}

// --- In-Memory Database ---
let equipment: Equipment[] = [
    {
      id: "EQ001",
      name: "Conveyor Belt #1",
      location: "Production Line A",
      type: "conveyor",
      status: "operational",
      voltage: "480V",
      capacity: "2000 lbs/hr"
    },
    {
      id: "EQ002",
      name: "Press Machine #3",
      location: "Manufacturing Floor B",
      type: "press",
      status: "locked_out",
      lastLockout: "2024-07-29 09:30",
      assignedTo: "Mike Johnson",
      lockoutReason: "Monthly maintenance",
      pressure: "150 PSI"
    },
    {
      id: "EQ003",
      name: "Robotic Arm #2",
      location: "Assembly Line C",
      type: "robotic_arm",
      status: "maintenance",
      voltage: "240V"
    },
    {
      id: "EQ004",
      name: "Hydraulic Press #1",
      location: "Manufacturing Floor A",
      type: "hydraulic_press",
      status: "operational",
      pressure: "3000 PSI",
      voltage: "480V"
    },
    {
      id: "EQ005",
      name: "Emergency Generator #1",
      location: "Power House",
      type: "generator",
      status: "operational",
      voltage: "480V/277V",
      capacity: "500 kW"
    },
    {
      id: "EQ006",
      name: "Centrifugal Pump #4",
      location: "Chemical Processing Unit",
      type: "pump",
      status: "operational",
      pressure: "250 PSI",
      voltage: "480V",
      capacity: "500 GPM"
    },
    {
      id: "EQ007",
      name: "Air Compressor #2",
      location: "Utility Room",
      type: "compressor",
      status: "locked_out",
      lastLockout: "2024-07-29 07:15",
      assignedTo: "David Chen",
      lockoutReason: "Filter replacement",
      pressure: "125 PSI",
      voltage: "480V"
    },
    {
      id: "EQ008",
      name: "Overhead Crane #1",
      location: "Heavy Assembly Bay",
      type: "crane",
      status: "operational",
      voltage: "480V",
      capacity: "20 Ton"
    },
    {
      id: "EQ009",
      name: "Industrial Mixer #3",
      location: "Chemical Processing",
      type: "mixer",
      status: "maintenance",
      voltage: "480V",
      capacity: "1000 Gallon"
    },
    {
      id: "EQ010",
      name: "Heat Treatment Oven",
      location: "Metal Processing",
      type: "oven",
      status: "operational",
      voltage: "480V",
      capacity: "2000°F Max"
    }
];

let notifications: Notification[] = [
    {
      id: "n001",
      type: "critical",
      title: "Overdue Lockout Alert",
      message: "Industrial Mixer #3 has exceeded planned lockout duration by 3 hours. Immediate attention required.",
      timestamp: "2024-07-29 14:30:00",
      equipmentId: "EQ009",
      isRead: false,
      requiresAction: true,
      priority: 1
    },
    {
      id: "n002",
      type: "critical",
      title: "Safety Violation",
      message: "Attempt to operate Emergency Generator #1 while safety systems detected high temperature.",
      timestamp: "2024-07-29 13:45:00",
      equipmentId: "EQ005",
      isRead: false,
      requiresAction: true,
      priority: 1
    },
    {
      id: "n003",
      type: "warning",
      title: "Missing Signature",
      message: "Air Compressor #2 lockout procedure completed but missing required supervisor signature.",
      timestamp: "2024-07-29 12:15:00",
      equipmentId: "EQ007",
      isRead: false,
      requiresAction: true,
      priority: 2
    },
    {
      id: "n004",
      type: "warning",
      title: "Equipment Anomaly",
      message: "Hydraulic Press #1 showing unusual pressure readings. Consider scheduling inspection.",
      timestamp: "2024-07-29 11:20:00",
      equipmentId: "EQ004",
      isRead: false,
      requiresAction: false,
      priority: 3
    },
    {
      id: "n005",
      type: "info",
      title: "Scheduled Maintenance",
      message: "Overhead Crane #1 is scheduled for routine maintenance tomorrow at 06:00 AM.",
      timestamp: "2024-07-29 10:00:00",
      equipmentId: "EQ008",
      isRead: true,
      requiresAction: false,
      priority: 4
    },
    {
      id: "n006",
      type: "info",
      title: "Compliance Report",
      message: "Monthly safety compliance report is now available for download.",
      timestamp: "2024-07-29 09:00:00",
      isRead: true,
      requiresAction: false,
      priority: 5
    }
];

const lockoutProcedures = {
    conveyor: {
      steps: [ "Notify all personnel", "Stop conveyor", "Switch main control to OFF", "Lock out electrical disconnect", "Apply personal lock", "Test controls", "Block conveyor belt" ],
      hazards: ["Electrical shock", "Crushing/pinching", "Entanglement"],
      requiredPPE: ["Safety glasses", "Steel-toed boots", "Electrical gloves"]
    },
    // ... other procedures would be here
};

const analyticsData = {
    lockoutFrequency: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{ label: 'Initiated', data: [12, 19, 8, 15] }, { label: 'Completed', data: [10, 17, 7, 13] }]
    },
    // ... other analytics data
};

const currentUser = {
    name: "John Smith",
    role: "Safety Supervisor",
    id: "JS001"
};

const app = new Hono()

// --- API Endpoints ---

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/user', (c) => c.json(currentUser))

app.get('/equipment', (c) => c.json(equipment))

app.post('/equipment/:id/lockout', async (c) => {
    const id = c.req.param('id')
    const { reason, user } = await c.req.json()
    const eq = equipment.find(e => e.id === id)
    if (eq) {
        eq.status = 'locked_out'
        eq.lockoutReason = reason
        eq.assignedTo = user
        eq.lastLockout = new Date().toISOString()
        return c.json(eq)
    }
    return c.json({ error: 'Equipment not found' }, 404)
})

app.post('/equipment/:id/unlock', (c) => {
    const id = c.req.param('id')
    const eq = equipment.find(e => e.id === id)
    if (eq) {
        eq.status = 'operational'
        eq.lockoutReason = undefined
        eq.assignedTo = undefined
        eq.lastLockout = undefined
        return c.json(eq)
    }
    return c.json({ error: 'Equipment not found' }, 404)
})

app.get('/notifications', (c) => c.json(notifications))

app.post('/notifications/read', async (c) => {
    const { id } = await c.req.json()
    const notification = notifications.find(n => n.id === id)
    if (notification) {
        notification.isRead = true
    }
    return c.json({ ok: true })
})

app.post('/notifications/read-all', (c) => {
    notifications.forEach(n => n.isRead = true)
    return c.json({ ok: true })
})

app.delete('/notifications/:id', (c) => {
    const id = c.req.param('id')
    notifications = notifications.filter(n => n.id !== id)
    return c.json({ ok: true })
})


app.get('/procedures', (c) => c.json(lockoutProcedures))

app.get('/analytics', (c) => c.json(analyticsData))

export default app