// src/data/parkingEvents.ts

export type ParkingEventType = 'Football' | 'Basketball' | 'Campus Event';

export type ImpactLevel = 'Low' | 'Medium' | 'High';

export interface ParkingEvent {
  id: string;
  title: string;
  type: ParkingEventType;
  date: string;        
  time: string;      
  venue: string;      
  lotsAffected: string[];
  impactLevel: ImpactLevel;
  notes?: string;
}

// Mock data 
export const parkingEvents: ParkingEvent[] = [
  {
    id: 'fb-2025-09-06',
    title: 'KU vs Kansas State (Football)',
    type: 'Football',
    date: '2025-09-06',
    time: '6:30 PM',
    venue: 'David Booth Kansas Memorial Stadium',
    lotsAffected: ['Allen Fieldhouse Lot', 'Mississippi Street Garage', 'Lot 72'],
    impactLevel: 'High',
    notes: 'Expect heavy traffic 2 hours before kickoff and 1 hour after the game.',
  },
  {
    id: 'bb-2025-11-15',
    title: 'KU vs Baylor (Men’s Basketball)',
    type: 'Basketball',
    date: '2025-11-15',
    time: '7:00 PM',
    venue: 'Allen Fieldhouse',
    lotsAffected: ['Allen Fieldhouse Lot', 'Mississippi Street Garage'],
    impactLevel: 'High',
    notes: 'Fieldhouse lots may be full by 5:30 PM.',
  },
  {
    id: 'bb-2025-11-22',
    title: 'KU vs Iowa State (Women’s Basketball)',
    type: 'Basketball',
    date: '2025-11-22',
    time: '1:00 PM',
    venue: 'Allen Fieldhouse',
    lotsAffected: ['Allen Fieldhouse Lot'],
    impactLevel: 'Medium',
    notes: 'Good alternative: Lot 90 with a short walk.',
  },
  {
    id: 'campus-2025-10-01',
    title: 'Engineering Career Fair',
    type: 'Campus Event',
    date: '2025-10-01',
    time: '9:00 AM – 4:00 PM',
    venue: 'Kansas Union / Engineering Complex',
    lotsAffected: ['Allen Fieldhouse Lot', 'Allen Fieldhouse Garage'],
    impactLevel: 'Medium',
    notes: 'Morning peak between 8:30–10:00 AM.',
  },
  {
    id: 'campus-2025-08-24',
    title: 'Move-In Weekend',
    type: 'Campus Event',
    date: '2025-08-24',
    time: 'All Day',
    venue: 'Residence Halls',
    lotsAffected: ['Ellsworth Lot', 'Lewis Lot', 'GSP/Corbin Area'],
    impactLevel: 'High',
    notes: 'Expect congestion near residence halls all day.',
  },
];
