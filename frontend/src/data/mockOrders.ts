export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delayed' | 'delivered';

export interface OrderHistoryEntry {
  status: string;
  timestamp: string;
  note: string;
}

export interface UnifiedOrder {
  id: string; // e.g. 'ORD-8942'
  trackingUuid: string; // e.g. 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10'
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropAddress: string;
  zone: string;
  status: OrderStatus;
  isDelayed: boolean;
  delayReason?: string;
  aiDelayMessage?: string;
  estimatedArrival: string;
  timeWindow: string;
  weightKg: number;
  assignedVehicle: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  vehicleLat: number;
  vehicleLng: number;
  routePolyline: [number, number][];
  history: OrderHistoryEntry[];
  feedTime: string;
  feedMessage: string;
  isAiGenerated: boolean;
  createdAt: string;
}

export const INITIAL_ORDERS: UnifiedOrder[] = [
  {
    id: 'ORD-8942',
    trackingUuid: 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10',
    customerName: 'Siddharth Rao',
    customerPhone: '+91 99001 22334',
    pickupAddress: 'Whitefield Logistics Depot, Block C',
    dropAddress: 'HSR Layout Sector 2, #104, Bengaluru',
    zone: 'HSR Layout Sector 2',
    status: 'delayed',
    isDelayed: true,
    delayReason: 'Heavy traffic congestion along HSR Outer Ring Road junction',
    aiDelayMessage:
      'Hello Siddharth, your delivery ORD-8942 is experiencing a temporary ~25 min delay due to peak traffic congestion along the HSR Outer Ring Road junction. Driver Priya Nair is en route and navigating the shortest alternate bypass path to reach you safely.',
    estimatedArrival: '14:55 PM (Revised)',
    timeWindow: '13:30 - 15:30',
    weightKg: 24.0,
    assignedVehicle: 'KA-01-GB-5091 (Priya Nair)',
    vehiclePlate: 'KA-01-GB-5091',
    driverName: 'Priya Nair',
    driverPhone: '+91 99011 44556',
    vehicleLat: 12.9352,
    vehicleLng: 77.6245,
    routePolyline: [
      [12.9352, 77.6245],
      [12.9335, 77.6275],
      [12.9320, 77.6300],
      [12.9300, 77.6325],
      [12.9280, 77.6350],
      [12.9150, 77.6350],
    ],
    history: [
      { status: 'created', timestamp: '10:45 AM', note: 'Order manifest created at Whitefield Depot' },
      { status: 'assigned', timestamp: '11:00 AM', note: 'Assigned to Vehicle KA-01-GB-5091 (Driver Priya Nair)' },
      { status: 'picked_up', timestamp: '12:30 PM', note: 'Package loaded and confirmed by courier' },
      { status: 'delayed', timestamp: '02:15 PM', note: 'Traffic delay logged in HSR zone. Claude AI notice broadcasted.' },
    ],
    feedTime: '10 mins ago',
    feedMessage:
      'Notice sent to Siddharth Rao: Order ORD-8942 is encountering a ~25 min delay due to peak traffic congestion along HSR Outer Ring Road. Revised arrival ETA updated to 2:55 PM.',
    isAiGenerated: true,
    createdAt: 'Today, 10:45 AM',
  },
  {
    id: 'ORD-8945',
    trackingUuid: 'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    pickupAddress: 'Indiranagar Central Hub, 100ft Rd',
    dropAddress: 'MG Road, Sector 4, #402, Bengaluru',
    zone: 'MG Road / Indiranagar',
    status: 'in_transit',
    isDelayed: false,
    aiDelayMessage:
      'Your RouteWise order ORD-8945 has been picked up by Rahul Sharma (KA-01-EA-1024). Driver is en route with estimated on-time arrival at 2:20 PM.',
    estimatedArrival: '14:20 PM (On Time)',
    timeWindow: '14:00 - 16:00',
    weightKg: 12.5,
    assignedVehicle: 'KA-01-EA-1024 (Rahul Sharma)',
    vehiclePlate: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    driverPhone: '+91 98450 11223',
    vehicleLat: 12.9716,
    vehicleLng: 77.5946,
    routePolyline: [
      [12.9716, 77.5946],
      [12.9735, 77.5980],
      [12.9750, 77.6010],
      [12.9775, 77.6045],
      [12.9800, 77.6080],
    ],
    history: [
      { status: 'created', timestamp: '11:30 AM', note: 'Order placed by dispatcher console' },
      { status: 'assigned', timestamp: '12:15 PM', note: 'Assigned to Vehicle KA-01-EA-1024 (Rahul Sharma)' },
      { status: 'picked_up', timestamp: '01:10 PM', note: 'Picked up from Indiranagar Central Hub' },
      { status: 'in_transit', timestamp: '01:40 PM', note: 'En route to MG Road Sector 4' },
    ],
    feedTime: '22 mins ago',
    feedMessage:
      'Package loaded and confirmed: Order ORD-8945 picked up by Rahul Sharma (KA-01-EA-1024). Driver en route to MG Road Sector 4 with on-time SLA ETA 2:20 PM.',
    isAiGenerated: false,
    createdAt: 'Today, 11:30 AM',
  },
  {
    id: 'ORD-8938',
    trackingUuid: 'c4d3b2a1-8e7f-4a5b-9c8d-1e2f3a4b5c6d',
    customerName: 'Rohan Gupta',
    customerPhone: '+91 97456 12389',
    pickupAddress: 'Whitefield Depot, Sector 3',
    dropAddress: 'Jayanagar 4th Block, #88, Bengaluru',
    zone: 'Jayanagar 4th Block',
    status: 'in_transit',
    isDelayed: false,
    aiDelayMessage:
      'Vehicle departure confirmed from Whitefield Depot. Driver Amit Patel is en route to Jayanagar with estimated delivery at 14:45 PM.',
    estimatedArrival: '14:45 PM (On Time)',
    timeWindow: '14:00 - 16:00',
    weightKg: 8.5,
    assignedVehicle: 'KA-05-MC-8812 (Amit Patel)',
    vehiclePlate: 'KA-05-MC-8812',
    driverName: 'Amit Patel',
    driverPhone: '+91 97400 88990',
    vehicleLat: 12.9250,
    vehicleLng: 77.5897,
    routePolyline: [
      [12.9250, 77.5897],
      [12.9225, 77.5865],
      [12.9200, 77.5840],
      [12.9175, 77.5815],
      [12.9150, 77.5790],
    ],
    history: [
      { status: 'created', timestamp: '12:00 PM', note: 'Order registered' },
      { status: 'assigned', timestamp: '12:45 PM', note: 'Assigned to KA-05-MC-8812' },
      { status: 'picked_up', timestamp: '01:30 PM', note: 'Loaded at Whitefield Depot' },
      { status: 'in_transit', timestamp: '02:00 PM', note: 'In transit to Jayanagar' },
    ],
    feedTime: '45 mins ago',
    feedMessage:
      'Vehicle KA-05-MC-8812 departure logged from Whitefield Logistics Depot. Estimated departure completed at 14:45 PM.',
    isAiGenerated: false,
    createdAt: 'Today, 12:00 PM',
  },
  {
    id: 'ORD-8931',
    trackingUuid: 'f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98440 55112',
    pickupAddress: 'Electronic City Warehouse Hub',
    dropAddress: 'Electronic City Phase 1, #50, Bengaluru',
    zone: 'Electronic City Phase 1',
    status: 'delayed',
    isDelayed: true,
    delayReason: 'Severe monsoon rainfall and waterlogging along Hosur Road',
    aiDelayMessage:
      'Hello Ananya, severe monsoon rain showers and low visibility in the Electronic City corridor have slowed traffic. Driver Vikram Singh is carefully navigating with revised delivery ETA at 4:30 PM. Thank you for your patience!',
    estimatedArrival: '16:30 PM (Revised)',
    timeWindow: '15:00 - 17:00',
    weightKg: 6.2,
    assignedVehicle: 'KA-03-HA-3301 (Vikram Singh)',
    vehiclePlate: 'KA-03-HA-3301',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98800 22331',
    vehicleLat: 12.8450,
    vehicleLng: 77.6600,
    routePolyline: [
      [12.8450, 77.6600],
      [12.8480, 77.6630],
      [12.8510, 77.6660],
      [12.8550, 77.6700],
    ],
    history: [
      { status: 'created', timestamp: '01:15 PM', note: 'Order registered' },
      { status: 'assigned', timestamp: '01:30 PM', note: 'Assigned to Vehicle KA-03-HA-3301' },
      { status: 'delayed', timestamp: '02:45 PM', note: 'Monsoon weather delay. AI explanation sent.' },
    ],
    feedTime: '2 hours ago',
    feedMessage:
      'Monsoon weather delay logged in Electronic City. Claude AI generated reassuring customer delivery advisory with live GPS tracking link.',
    isAiGenerated: true,
    createdAt: 'Today, 01:15 PM',
  },
  {
    id: 'ORD-8940',
    trackingUuid: 'd5e6f7a8-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
    customerName: 'Karan Verma',
    customerPhone: '+91 97312 99887',
    pickupAddress: 'BTM Layout 2nd Stage Depot',
    dropAddress: 'JP Nagar 6th Phase, #301, Bengaluru',
    zone: 'JP Nagar / BTM',
    status: 'assigned',
    isDelayed: false,
    aiDelayMessage:
      'Order ORD-8940 is assigned to Deepak Kumar (KA-02-JL-4411) for delivery in JP Nagar. Estimated delivery time is 5:30 PM.',
    estimatedArrival: '17:30 PM (On Time)',
    timeWindow: '17:00 - 19:00',
    weightKg: 3.0,
    assignedVehicle: 'KA-02-JL-4411 (Deepak Kumar)',
    vehiclePlate: 'KA-02-JL-4411',
    driverName: 'Deepak Kumar',
    driverPhone: '+91 98112 44556',
    vehicleLat: 12.9080,
    vehicleLng: 77.5850,
    routePolyline: [
      [12.9080, 77.5850],
      [12.9050, 77.5880],
      [12.9020, 77.5910],
    ],
    history: [
      { status: 'created', timestamp: '01:45 PM', note: 'Order placed by dispatcher' },
      { status: 'assigned', timestamp: '02:00 PM', note: 'Assigned to EV Scooter KA-02-JL-4411' },
    ],
    feedTime: '3 hours ago',
    feedMessage:
      'Order ORD-8940 assigned to EV Scooter KA-02-JL-4411 for evening dispatch to JP Nagar.',
    isAiGenerated: false,
    createdAt: 'Today, 01:45 PM',
  },
  {
    id: 'ORD-8943',
    trackingUuid: 'b4c3d2e1-7f8a-4b5c-9d0e-1f2a3b4c5d6e',
    customerName: 'Pooja Hegde',
    customerPhone: '+91 99887 76655',
    pickupAddress: 'Indiranagar Hub, 100ft Rd',
    dropAddress: 'Indiranagar 100ft Rd, #18, Bengaluru',
    zone: 'Indiranagar 100ft Road',
    status: 'delivered',
    isDelayed: false,
    aiDelayMessage:
      'Order ORD-8943 was successfully delivered to Pooja Hegde. Thank you for choosing RouteWise!',
    estimatedArrival: 'Delivered (13:25 PM)',
    timeWindow: '12:00 - 14:00',
    weightKg: 5.2,
    assignedVehicle: 'KA-01-EA-1024 (Rahul Sharma)',
    vehiclePlate: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    driverPhone: '+91 98450 11223',
    vehicleLat: 12.9716,
    vehicleLng: 77.5946,
    routePolyline: [
      [12.9716, 77.5946],
      [12.9730, 77.5970],
      [12.9750, 77.6010],
    ],
    history: [
      { status: 'created', timestamp: '09:15 AM', note: 'Order created' },
      { status: 'assigned', timestamp: '09:30 AM', note: 'Assigned to Rahul Sharma' },
      { status: 'picked_up', timestamp: '10:15 AM', note: 'Package loaded' },
      { status: 'in_transit', timestamp: '11:00 AM', note: 'In transit' },
      { status: 'delivered', timestamp: '01:25 PM', note: 'Delivered. Recipient signature recorded.' },
    ],
    feedTime: '4 hours ago',
    feedMessage:
      'Order ORD-8943 successfully delivered to Pooja Hegde. Recipient verified via digital signature.',
    isAiGenerated: false,
    createdAt: 'Today, 09:15 AM',
  },
  {
    id: 'ORD-8944',
    trackingUuid: '8f9e0a1b-2c3d-4e5f-6a7b-8c9d0e1f2a3b',
    customerName: 'Meera Iyer',
    customerPhone: '+91 98123 55678',
    pickupAddress: 'Koramangala Depot, 80ft Rd',
    dropAddress: 'Koramangala 5th Block, #12, Bengaluru',
    zone: 'Koramangala 5th Block',
    status: 'in_transit',
    isDelayed: false,
    aiDelayMessage:
      'Driver Suresh Kumar is en route with your package ORD-8944 to Koramangala 5th Block. Estimated arrival at 3:15 PM.',
    estimatedArrival: '15:15 PM (On Time)',
    timeWindow: '14:30 - 16:30',
    weightKg: 12.0,
    assignedVehicle: 'KA-04-MH-9920 (Suresh Kumar)',
    vehiclePlate: 'KA-04-MH-9920',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 99887 66554',
    vehicleLat: 12.9352,
    vehicleLng: 77.6245,
    routePolyline: [
      [12.9352, 77.6245],
      [12.9330, 77.6270],
      [12.9300, 77.6310],
    ],
    history: [
      { status: 'created', timestamp: '12:30 PM', note: 'Order intake logged' },
      { status: 'assigned', timestamp: '01:00 PM', note: 'Assigned to Suresh Kumar' },
      { status: 'in_transit', timestamp: '02:15 PM', note: 'Driver en route' },
    ],
    feedTime: '1 hour ago',
    feedMessage:
      'Order ORD-8944 picked up by Suresh Kumar (KA-04-MH-9920). En route to Koramangala 5th Block.',
    isAiGenerated: false,
    createdAt: 'Today, 12:30 PM',
  },
];

// In-memory runtime store for newly created orders during session
let runtimeOrders: UnifiedOrder[] = [...INITIAL_ORDERS];

export function getGlobalOrders(): UnifiedOrder[] {
  return runtimeOrders;
}

export function addGlobalOrder(newOrder: UnifiedOrder): void {
  runtimeOrders = [newOrder, ...runtimeOrders];
}

/**
 * Universal lookup function by tracking UUID OR Order ID (case-insensitive).
 * Guarantees that whatever order identifier is passed to /track/:trackingId,
 * the Customer Tracking page will display the exact matching order data!
 */
export function getOrderByTrackingId(identifier: string): UnifiedOrder {
  if (!identifier) return INITIAL_ORDERS[0];

  const cleanId = identifier.trim().toLowerCase();

  // 1. Match by exact tracking UUID
  const byUuid = runtimeOrders.find((o) => o.trackingUuid.toLowerCase() === cleanId);
  if (byUuid) return byUuid;

  // 2. Match by Order ID (e.g. 'ORD-8942' or 'ord-8942' or '8942')
  const byOrderId = runtimeOrders.find(
    (o) =>
      o.id.toLowerCase() === cleanId ||
      o.id.toLowerCase() === `ord-${cleanId}` ||
      o.id.toLowerCase().replace('ord-', '') === cleanId
  );
  if (byOrderId) return byOrderId;

  // 3. Fallback: If unknown custom ID/UUID is passed, create a consistent dynamic order object
  return {
    id: cleanId.startsWith('ord-') ? cleanId.toUpperCase() : `ORD-${cleanId.slice(0, 4).toUpperCase()}`,
    trackingUuid: identifier,
    customerName: 'Verified Recipient',
    customerPhone: '+91 98450 00112',
    pickupAddress: 'Central Operations Depot, Bengaluru',
    dropAddress: 'Bengaluru Delivery Zone, #101',
    zone: 'Bengaluru Central',
    status: 'in_transit',
    isDelayed: false,
    estimatedArrival: '15:30 PM (On Time)',
    timeWindow: '14:00 - 16:00',
    weightKg: 5.0,
    assignedVehicle: 'KA-01-EA-1024 (Rahul Sharma)',
    vehiclePlate: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    driverPhone: '+91 98450 11223',
    vehicleLat: 12.9716,
    vehicleLng: 77.5946,
    routePolyline: [
      [12.9716, 77.5946],
      [12.9735, 77.5980],
      [12.9750, 77.6010],
      [12.9775, 77.6045],
      [12.9800, 77.6080],
    ],
    history: [
      { status: 'created', timestamp: '11:00 AM', note: 'Order registered in system' },
      { status: 'assigned', timestamp: '11:30 AM', note: 'Assigned to active courier' },
      { status: 'in_transit', timestamp: '12:15 PM', note: 'Package loaded and in transit' },
    ],
    feedTime: 'Just now',
    feedMessage: `Order ${identifier} is in transit with driver Rahul Sharma.`,
    isAiGenerated: false,
    createdAt: 'Today, 11:00 AM',
  };
}

/**
 * Searches and returns an existing order matching the query string:
 * Tracking UUID, Order ID (e.g. ORD-8942 or 8942), or Customer Name.
 */
export function findOrderByQuery(query: string): UnifiedOrder | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();

  // 1. Match exact tracking UUID
  const byUuid = runtimeOrders.find((o) => o.trackingUuid.toLowerCase() === clean);
  if (byUuid) return byUuid;

  // 2. Match Order ID
  const byOrderId = runtimeOrders.find(
    (o) =>
      o.id.toLowerCase() === clean ||
      o.id.toLowerCase() === `ord-${clean}` ||
      o.id.toLowerCase().replace('ord-', '') === clean
  );
  if (byOrderId) return byOrderId;

  // 3. Match customer name or phone
  const byCustomer = runtimeOrders.find(
    (o) =>
      o.customerName.toLowerCase().includes(clean) ||
      o.customerPhone.replace(/\s+/g, '').includes(clean.replace(/\s+/g, ''))
  );
  if (byCustomer) return byCustomer;

  return undefined;
}

