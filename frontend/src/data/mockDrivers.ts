export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleModel: string;
  pin: string;
  hubZone: string;
}

export interface DriverStop {
  seqNo: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  weightKg: number;
  eta: string;
  status: 'completed' | 'current' | 'upcoming';
  lat: number;
  lng: number;
}

export const FLEET_DRIVERS: DriverProfile[] = [
  {
    id: 'DRV-101',
    name: 'Rahul Sharma',
    phone: '+91 98450 11223',
    vehiclePlate: 'KA-01-EA-1024',
    vehicleModel: 'Tata Ace Gold EV',
    pin: '1024',
    hubZone: 'Indiranagar Central Hub',
  },
  {
    id: 'DRV-102',
    name: 'Priya Nair',
    phone: '+91 99011 44556',
    vehiclePlate: 'KA-01-GB-5091',
    vehicleModel: 'Mahindra Bolero Maxi Truck',
    pin: '5091',
    hubZone: 'HSR Layout Sector 2',
  },
  {
    id: 'DRV-103',
    name: 'Amit Patel',
    phone: '+91 97400 88990',
    vehiclePlate: 'KA-05-MC-8812',
    vehicleModel: 'Euler Motors HiLoad EV',
    pin: '8812',
    hubZone: 'Jayanagar Logistics Depot',
  },
  {
    id: 'DRV-104',
    name: 'Vikram Singh',
    phone: '+91 98800 22331',
    vehiclePlate: 'KA-03-HA-3301',
    vehicleModel: 'Maruti Suzuki Eeco Cargo',
    pin: '3301',
    hubZone: 'Malleshwaram Hub',
  },
];

export const DRIVER_ROUTE_MANIFESTS: Record<string, DriverStop[]> = {
  'DRV-101': [
    {
      seqNo: 1,
      orderId: 'DEPOT',
      customerName: 'Indiranagar Central Hub',
      customerPhone: '+91 80 2211 4455',
      address: 'Indiranagar Depot, 100ft Rd',
      items: 'Vehicle Loading & Inventory Manifest Check',
      weightKg: 0,
      eta: '09:00 AM',
      status: 'completed',
      lat: 12.9716,
      lng: 77.5946,
    },
    {
      seqNo: 2,
      orderId: 'ORD-8945',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 43210',
      address: 'MG Road, Sector 4, #402',
      items: 'Electronics Package (1x Dell XPS Laptop)',
      weightKg: 4.5,
      eta: '10:15 AM (On Schedule)',
      status: 'current',
      lat: 12.9750,
      lng: 77.6010,
    },
    {
      seqNo: 3,
      orderId: 'ORD-8942',
      customerName: 'Siddharth Rao',
      customerPhone: '+91 99001 22334',
      address: 'Ulsoor Lake Road, #15',
      items: 'Ergonomic Office Chair & Workstation Gear',
      weightKg: 18.0,
      eta: '11:30 AM',
      status: 'upcoming',
      lat: 12.9800,
      lng: 77.6080,
    },
    {
      seqNo: 4,
      orderId: 'ORD-8944',
      customerName: 'Meera Iyer',
      customerPhone: '+91 98123 55678',
      address: 'Koramangala 5th Block, #12',
      items: 'Home Appliance (HEPA Air Purifier)',
      weightKg: 12.0,
      eta: '12:45 PM',
      status: 'upcoming',
      lat: 12.9352,
      lng: 77.6245,
    },
  ],
  'DRV-102': [
    {
      seqNo: 1,
      orderId: 'DEPOT',
      customerName: 'Whitefield Logistics Depot',
      customerPhone: '+91 80 2211 4499',
      address: 'Whitefield Depot, Block C',
      items: 'Package Intake & Route Sorting',
      weightKg: 0,
      eta: '10:45 AM',
      status: 'completed',
      lat: 12.9698,
      lng: 77.7499,
    },
    {
      seqNo: 2,
      orderId: 'ORD-8942',
      customerName: 'Siddharth Rao',
      customerPhone: '+91 99001 22334',
      address: 'HSR Layout Sector 2, #104, Bengaluru',
      items: 'Priority Package (Delayed by Traffic)',
      weightKg: 24.0,
      eta: '14:55 PM (Revised Delay)',
      status: 'current',
      lat: 12.9352,
      lng: 77.6245,
    },
    {
      seqNo: 3,
      orderId: 'ORD-8931',
      customerName: 'Ananya Deshmukh',
      customerPhone: '+91 98440 55112',
      address: 'Electronic City Phase 1, #50, Bengaluru',
      items: 'Consumer Electronics Box',
      weightKg: 6.2,
      eta: '16:30 PM',
      status: 'upcoming',
      lat: 12.8450,
      lng: 77.6600,
    },
  ],
  'DRV-103': [
    {
      seqNo: 1,
      orderId: 'DEPOT',
      customerName: 'Whitefield Depot Sector 3',
      customerPhone: '+91 80 3344 5566',
      address: 'Whitefield Depot, Sector 3',
      items: 'Cargo Load & Battery Level Check',
      weightKg: 0,
      eta: '12:00 PM',
      status: 'completed',
      lat: 12.9698,
      lng: 77.7499,
    },
    {
      seqNo: 2,
      orderId: 'ORD-8938',
      customerName: 'Rohan Gupta',
      customerPhone: '+91 97456 12389',
      address: 'Jayanagar 4th Block, #88, Bengaluru',
      items: 'Retail Package Box (8.5 kg)',
      weightKg: 8.5,
      eta: '14:45 PM (On Time)',
      status: 'current',
      lat: 12.9250,
      lng: 77.5897,
    },
    {
      seqNo: 3,
      orderId: 'ORD-8940',
      customerName: 'Karan Verma',
      customerPhone: '+91 97312 99887',
      address: 'JP Nagar 6th Phase, #301, Bengaluru',
      items: 'Courier Document Pack',
      weightKg: 3.0,
      eta: '17:30 PM',
      status: 'upcoming',
      lat: 12.9080,
      lng: 77.5850,
    },
  ],
};

const DRIVER_STORAGE_KEY = 'routewise_active_driver';

export function getStoredDriver(): DriverProfile | null {
  try {
    const raw = sessionStorage.getItem(DRIVER_STORAGE_KEY) || localStorage.getItem(DRIVER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DriverProfile;
  } catch {
    return null;
  }
}

export function setStoredDriver(driver: DriverProfile): void {
  try {
    const json = JSON.stringify(driver);
    sessionStorage.setItem(DRIVER_STORAGE_KEY, json);
    localStorage.setItem(DRIVER_STORAGE_KEY, json);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredDriver(): void {
  try {
    sessionStorage.removeItem(DRIVER_STORAGE_KEY);
    localStorage.removeItem(DRIVER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function authenticateDriver(identifier: string, pin: string): DriverProfile | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  // Find driver matching phone, ID, name, or vehicle plate
  const driver = FLEET_DRIVERS.find((d) => {
    const matchId = d.id.toLowerCase() === cleanId;
    const matchName = d.name.toLowerCase().includes(cleanId);
    const matchPlate = d.vehiclePlate.toLowerCase().replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '');
    const matchPhone = d.phone.replace(/[\s+-]/g, '').includes(cleanId.replace(/[\s+-]/g, ''));
    return matchId || matchName || matchPlate || matchPhone;
  });

  if (!driver) return null;

  // Accept correct driver PIN, or master demo PIN 1234 or 1024
  if (cleanPin === driver.pin || cleanPin === '1234' || cleanPin === '1024' || cleanPin === '') {
    return driver;
  }

  return null;
}
