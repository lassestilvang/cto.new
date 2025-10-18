import { usePlanner } from '@/lib/store';

describe('Planner store', () => {
  it('schedules a task without conflict', () => {
    const s = usePlanner.getState();
    const id = s.addTask({ title: 'Test task', category: 'Work' });
    const start = new Date();
    start.setHours(10,0,0,0);
    const end = new Date(start.getTime() + 60*60000);
    s.scheduleTask(id, start.toISOString(), end.toISOString());
    const t = usePlanner.getState().items[id];
    expect(t && t.type === 'task' && t.scheduledStart).toBeTruthy();
  });

  it('detects conflict between items', () => {
    const s = usePlanner.getState();
    const id1 = s.addTask({ title: 'A', category: 'Work' });
    const id2 = s.addTask({ title: 'B', category: 'Work' });
    const start = new Date();
    start.setHours(9,0,0,0);
    const end = new Date(start.getTime() + 60*60000);
    s.scheduleTask(id1, start.toISOString(), end.toISOString());
    const conflicts = s.conflictsAt(start.toISOString(), end.toISOString(), id2);
    expect(conflicts.length).toBeGreaterThan(0);
  });
});
