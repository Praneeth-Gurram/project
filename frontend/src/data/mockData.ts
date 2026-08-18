export const stats = [
  { title: 'On-time delivery', value: '94.8%', change: '+2.1%', trend: 'up' as const, icon: '📦' },
  { title: 'Inventory turnover', value: '7.2x', change: '+0.4x', trend: 'up' as const, icon: '📈' },
  { title: 'Supplier risk', value: '12%', change: '-3%', trend: 'down' as const, icon: '⚠️' },
  { title: 'Forecast accuracy', value: '91.4%', change: '+1.8%', trend: 'up' as const, icon: '🎯' },
]

export const orders = [
  { id: 101, name: 'Northwind Bulk Order', category: 'Retail', status: 'In Transit', value: '$184,200', region: 'EMEA' },
  { id: 102, name: 'Apex Medical Supplies', category: 'Healthcare', status: 'Delayed', value: '$98,450', region: 'NA' },
  { id: 103, name: 'BluePeak Components', category: 'Manufacturing', status: 'Delivered', value: '$76,900', region: 'APAC' },
]

export const shipments = [
  { id: 201, name: 'Container SH-204', category: 'Ocean', status: 'Arriving', value: '$48,300', region: 'LATAM' },
  { id: 202, name: 'Air Freight AF-110', category: 'Air', status: 'In Transit', value: '$22,100', region: 'NA' },
  { id: 203, name: 'Rail Route RR-88', category: 'Rail', status: 'Queued', value: '$19,500', region: 'EU' },
]

export const suppliers = [
  { id: 301, name: 'Helix Logistics', category: '3PL', status: 'Healthy', value: '$2.4M', region: 'Global' },
  { id: 302, name: 'Cobalt Parts', category: 'Manufacturing', status: 'Watch', value: '$892K', region: 'US' },
  { id: 303, name: 'Northstar Raw Materials', category: 'Procurement', status: 'Healthy', value: '$1.3M', region: 'EU' },
]

export const inventory = [
  { id: 401, name: 'Cold Chain Vaccine Kits', category: 'Healthcare', status: 'Low Stock', value: '142 units', region: 'NA' },
  { id: 402, name: 'Electronics PCB Sets', category: 'Electronics', status: 'Available', value: '2,340 units', region: 'APAC' },
  { id: 403, name: 'Industrial Bearings', category: 'Industrial', status: 'Reorder', value: '890 units', region: 'EMEA' },
]
