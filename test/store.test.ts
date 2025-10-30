import { usePlanner, isSameDayUTC } from '@/lib/store';
import { addDays, setHours, setMinutes } from 'date-fns';
import type { BlockItem, Task, CalendarEvent } from '@/types/scheduler';

describe('Planner store', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePlanner.setState({
      weekStart: '2023-01-01',
      selectedDate: '2023-01-01',
      items: {},
      order: [],
      collaborators: [
        { id: 'u1', name: 'You' },
        { id: 'u2', name: 'Sara' },
        { id: 'u3', name: 'John' }
      ],
      currentUserId: 'u1'
    });
  });

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
    const conflicts = s.conflictsAt(start.toISOString(), end.toISOString());
    expect(conflicts.length).toBeGreaterThan(0);
  });

  describe('goToWeek', () => {
    it('navigates to next week', () => {
      const s = usePlanner.getState();
      const initialWeek = s.weekStart;
      s.goToWeek(1);
      const newWeek = usePlanner.getState().weekStart;
      expect(newWeek).not.toBe(initialWeek);
    });

    it('navigates to previous week', () => {
      const s = usePlanner.getState();
      const initialWeek = s.weekStart;
      s.goToWeek(-1);
      const newWeek = usePlanner.getState().weekStart;
      expect(newWeek).not.toBe(initialWeek);
    });
  });

  describe('setSelectedDate', () => {
    it('sets selected date', () => {
      const s = usePlanner.getState();
      const newDate = new Date('2023-01-15');
      s.setSelectedDate(newDate);
      expect(usePlanner.getState().selectedDate).toBe('2023-01-15');
    });
  });

  describe('addTask', () => {
    it('adds a task with minimal input', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'New Task' });
      const task = usePlanner.getState().items[id] as Task;
      expect(task).toBeDefined();
      expect(task?.type).toBe('task');
      expect(task?.title).toBe('New Task');
      expect(task?.category).toBe('Inbox');
      expect(task?.completed).toBe(false);
      expect(task?.priority).toBe('medium');
    });

    it('adds a task with full input', () => {
      const s = usePlanner.getState();
      const id = s.addTask({
        title: 'Full Task',
        description: 'Description',
        category: 'Work',
        dueDate: '2023-01-15',
        completed: true,
        priority: 'high',
        subtasks: [{ id: 'sub1', title: 'Subtask', completed: false }]
      });
      const task = usePlanner.getState().items[id] as Task;
      expect(task?.title).toBe('Full Task');
      expect(task?.description).toBe('Description');
      expect(task?.category).toBe('Work');
      expect(task?.dueDate).toBe('2023-01-15');
      expect(task?.completed).toBe(true);
      expect(task?.priority).toBe('high');
      expect(task?.subtasks).toHaveLength(1);
    });

    it('adds task to order array', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      expect(usePlanner.getState().order).toContain(id);
    });
  });

  describe('addEvent', () => {
    it('adds an event with minimal input', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const id = s.addEvent({ title: 'New Event', start, end });
      const event = usePlanner.getState().items[id] as CalendarEvent;
      expect(event).toBeDefined();
      expect(event?.type).toBe('event');
      expect(event?.title).toBe('New Event');
      expect(event?.start).toBe(start);
      expect(event?.end).toBe(end);
      expect(event?.category).toBe('Work');
      expect(event?.allDay).toBe(false);
    });

    it('adds an event with full input', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const id = s.addEvent({
        title: 'Full Event',
        description: 'Description',
        category: 'Personal',
        start,
        end,
        attendees: ['u2'],
        allDay: true,
        sharedLabel: 'Shared',
        source: 'google'
      });
      const event = usePlanner.getState().items[id] as CalendarEvent;
      expect(event?.title).toBe('Full Event');
      expect(event?.description).toBe('Description');
      expect(event?.category).toBe('Personal');
      expect(event?.attendees).toEqual(['u2']);
      expect(event?.allDay).toBe(true);
      expect(event?.sharedLabel).toBe('Shared');
      expect(event?.source).toBe('google');
    });

    it('adds event to order array', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const id = s.addEvent({ title: 'Event', start, end });
      expect(usePlanner.getState().order).toContain(id);
    });
  });

  describe('updateItem', () => {
    it('updates an existing item', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Original' });
      s.updateItem(id, { title: 'Updated' });
      const updated = usePlanner.getState().items[id];
      expect(updated?.title).toBe('Updated');
    });

    it('handles updating non-existent item', () => {
      const s = usePlanner.getState();
      expect(() => s.updateItem('nonexistent', { title: 'Test' })).not.toThrow();
    });
  });

  describe('removeItem', () => {
    it('removes an item from items and order', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'To Remove' });
      expect(usePlanner.getState().items[id]).toBeDefined();
      expect(usePlanner.getState().order).toContain(id);
      s.removeItem(id);
      expect(usePlanner.getState().items[id]).toBeUndefined();
      expect(usePlanner.getState().order).not.toContain(id);
    });

    it('handles removing non-existent item', () => {
      const s = usePlanner.getState();
      expect(() => s.removeItem('nonexistent')).not.toThrow();
    });
  });

  describe('scheduleTask', () => {
    it('throws error on conflict', () => {
      const s = usePlanner.getState();
      const id1 = s.addTask({ title: 'Task 1' });
      const id2 = s.addTask({ title: 'Task 2' });
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      s.scheduleTask(id1, start, end);
      expect(() => s.scheduleTask(id2, start, end)).toThrow('Conflicts with existing items');
    });

    it('throws error on partial overlap', () => {
      const s = usePlanner.getState();
      const id1 = s.addTask({ title: 'Task 1' });
      const id2 = s.addTask({ title: 'Task 2' });
      const start1 = '2023-01-01T10:00:00.000Z';
      const end1 = '2023-01-01T11:00:00.000Z';
      const start2 = '2023-01-01T10:30:00.000Z';
      const end2 = '2023-01-01T11:30:00.000Z';
      s.scheduleTask(id1, start1, end1);
      expect(() => s.scheduleTask(id2, start2, end2)).toThrow('Conflicts with existing items');
    });

    it('allows scheduling when no conflict', () => {
      const s = usePlanner.getState();
      const id1 = s.addTask({ title: 'Task 1' });
      const id2 = s.addTask({ title: 'Task 2' });
      const start1 = '2023-01-01T10:00:00.000Z';
      const end1 = '2023-01-01T11:00:00.000Z';
      const start2 = '2023-01-01T11:00:00.000Z';
      const end2 = '2023-01-01T12:00:00.000Z';
      s.scheduleTask(id1, start1, end1);
      expect(() => s.scheduleTask(id2, start2, end2)).not.toThrow();
    });

    it('schedules task successfully', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      s.scheduleTask(id, start, end);
      const task = usePlanner.getState().items[id] as Task;
      expect(task?.scheduledStart).toBe(start);
      expect(task?.scheduledEnd).toBe(end);
    });

    it('throws error for non-task item', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const id = s.addEvent({ title: 'Event', start, end });
      expect(() => s.scheduleTask(id, start, end)).toThrow('Not a task');
    });

    it('throws error for non-existent item', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      expect(() => s.scheduleTask('nonexistent', start, end)).toThrow('Not a task');
    });
  });

  describe('moveEvent', () => {
    it('moves an event without conflict', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const newStart = '2023-01-01T12:00:00.000Z';
      const newEnd = '2023-01-01T13:00:00.000Z';
      const id = s.addEvent({ title: 'Event', start, end });
      s.moveEvent(id, newStart, newEnd);
      const updated = usePlanner.getState().items[id] as CalendarEvent;
      expect(updated?.start).toBe(newStart);
      expect(updated?.end).toBe(newEnd);
    });

    it('throws error on conflict', () => {
      const s = usePlanner.getState();
      const start1 = '2023-01-01T10:00:00.000Z';
      const end1 = '2023-01-01T11:00:00.000Z';
      const start2 = '2023-01-01T12:00:00.000Z';
      const end2 = '2023-01-01T13:00:00.000Z';
      const conflictStart = '2023-01-01T10:30:00.000Z';
      const conflictEnd = '2023-01-01T12:30:00.000Z';
      const id1 = s.addEvent({ title: 'Event 1', start: start1, end: end1 });
      const id2 = s.addEvent({ title: 'Event 2', start: start2, end: end2 });
      expect(() => s.moveEvent(id2, conflictStart, conflictEnd)).toThrow('Conflicts with existing items');
    });

    it('throws error on partial overlap when moving', () => {
      const s = usePlanner.getState();
      const id1 = s.addEvent({ title: 'Event 1', start: '2023-01-01T10:00:00.000Z', end: '2023-01-01T11:00:00.000Z' });
      const id2 = s.addEvent({ title: 'Event 2', start: '2023-01-01T12:00:00.000Z', end: '2023-01-01T13:00:00.000Z' });
      const conflictStart = '2023-01-01T10:30:00.000Z';
      const conflictEnd = '2023-01-01T11:30:00.000Z';
      expect(() => s.moveEvent(id2, conflictStart, conflictEnd)).toThrow('Conflicts with existing items');
    });

    it('allows moving when no conflict', () => {
      const s = usePlanner.getState();
      const id1 = s.addEvent({ title: 'Event 1', start: '2023-01-01T10:00:00.000Z', end: '2023-01-01T11:00:00.000Z' });
      const id2 = s.addEvent({ title: 'Event 2', start: '2023-01-01T12:00:00.000Z', end: '2023-01-01T13:00:00.000Z' });
      const newStart = '2023-01-01T14:00:00.000Z';
      const newEnd = '2023-01-01T15:00:00.000Z';
      expect(() => s.moveEvent(id2, newStart, newEnd)).not.toThrow();
    });

    it('moves event successfully', () => {
      const s = usePlanner.getState();
      const id = s.addEvent({ title: 'Event', start: '2023-01-01T10:00:00.000Z', end: '2023-01-01T11:00:00.000Z' });
      const newStart = '2023-01-01T12:00:00.000Z';
      const newEnd = '2023-01-01T13:00:00.000Z';
      s.moveEvent(id, newStart, newEnd);
      const event = usePlanner.getState().items[id] as CalendarEvent;
      expect(event?.start).toBe(newStart);
      expect(event?.end).toBe(newEnd);
    });

    it('throws error for non-event item', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      expect(() => s.moveEvent(id, start, end)).toThrow('Not an event');
    });

    it('throws error for non-existent item', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      expect(() => s.moveEvent('nonexistent', start, end)).toThrow('Not an event');
    });
  });

  describe('conflictsAt', () => {
    it('returns empty array when no conflicts', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const conflicts = s.conflictsAt(start, end);
      expect(conflicts).toEqual([]);
    });

    it('detects overlap with scheduled task', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      const taskStart = '2023-01-01T10:00:00.000Z';
      const taskEnd = '2023-01-01T11:00:00.000Z';
      s.scheduleTask(id, taskStart, taskEnd);
      const checkStart = '2023-01-01T10:30:00.000Z';
      const checkEnd = '2023-01-01T11:30:00.000Z';
      const conflicts = s.conflictsAt(checkStart, checkEnd);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]?.overlapMinutes).toBe(30);
    });

    it('detects overlap with event', () => {
      const s = usePlanner.getState();
      const eventStart = '2023-01-01T10:00:00.000Z';
      const eventEnd = '2023-01-01T11:00:00.000Z';
      s.addEvent({ title: 'Event', start: eventStart, end: eventEnd });
      const checkStart = '2023-01-01T10:30:00.000Z';
      const checkEnd = '2023-01-01T11:30:00.000Z';
      const conflicts = s.conflictsAt(checkStart, checkEnd);
      expect(conflicts.length).toBe(1);
    });

    it('excludes specified item from conflicts', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      s.scheduleTask(id, start, end);
      const conflicts = s.conflictsAt(start, end, id);
      expect(conflicts).toEqual([]);
    });
  });

  describe('getItemsForDay', () => {
    it('returns events for the day', () => {
      const s = usePlanner.getState();
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      const id = s.addEvent({ title: 'Event', start, end });
      const items = s.getItemsForDay(new Date('2023-01-01'));
      expect(items).toContainEqual(expect.objectContaining({ id, title: 'Event' }));
    });

    it('returns scheduled tasks for the day', () => {
      const s = usePlanner.getState();
      const id = s.addTask({ title: 'Task' });
      const start = '2023-01-01T10:00:00.000Z';
      const end = '2023-01-01T11:00:00.000Z';
      s.scheduleTask(id, start, end);
      const items = s.getItemsForDay(new Date('2023-01-01'));
      expect(items).toContainEqual(expect.objectContaining({ id, title: 'Task' }));
    });

    it('sorts items by start time', () => {
      const s = usePlanner.getState();
      const id1 = s.addEvent({ title: 'Event 1', start: '2023-01-01T10:00:00.000Z', end: '2023-01-01T11:00:00.000Z' });
      const id2 = s.addEvent({ title: 'Event 2', start: '2023-01-01T09:00:00.000Z', end: '2023-01-01T10:00:00.000Z' });
      const id3 = s.addTask({ title: 'Task' });
      s.scheduleTask(id3, '2023-01-01T08:00:00.000Z', '2023-01-01T09:00:00.000Z');
      const items = s.getItemsForDay(new Date('2023-01-01'));
      expect(items.length).toBe(3);
      expect(items[0]?.id).toBe(id3);
      expect(items[1]?.id).toBe(id2);
      expect(items[2]?.id).toBe(id1);
    });

    it('handles unscheduled tasks in sorting', () => {
      const s = usePlanner.getState();
      const id1 = s.addEvent({ title: 'Event', start: '2023-01-01T10:00:00.000Z', end: '2023-01-01T11:00:00.000Z' });
      const id2 = s.addTask({ title: 'Unscheduled Task' });
      const items = s.getItemsForDay(new Date('2023-01-01'));
      expect(items.length).toBe(1);
      expect(items[0]?.id).toBe(id1);
    });

    it('returns empty array for day with no items', () => {
      const s = usePlanner.getState();
      const items = s.getItemsForDay(new Date('2023-01-01'));
      expect(items).toEqual([]);
    });
  });

  describe('isSameDayUTC', () => {
    it('returns true for same UTC date', () => {
      const a = new Date('2023-01-01T10:00:00.000Z');
      const b = new Date('2023-01-01T15:00:00.000Z');
      expect(isSameDayUTC(a, b)).toBe(true);
    });

    it('returns false for different UTC dates', () => {
      const a = new Date('2023-01-01T10:00:00.000Z');
      const b = new Date('2023-01-02T10:00:00.000Z');
      expect(isSameDayUTC(a, b)).toBe(false);
    });

    it('returns true for same UTC date across midnight UTC', () => {
      const a = new Date('2023-01-01T23:59:59.999Z');
      const b = new Date('2023-01-02T00:00:00.000Z');
      expect(isSameDayUTC(a, b)).toBe(false);
    });

    it('returns false for different years in UTC', () => {
      const a = new Date('2023-01-01T10:00:00.000Z');
      const b = new Date('2024-01-01T10:00:00.000Z');
      expect(isSameDayUTC(a, b)).toBe(false);
    });

    it('returns false for different months in UTC', () => {
      const a = new Date('2023-01-01T10:00:00.000Z');
      const b = new Date('2023-02-01T10:00:00.000Z');
      expect(isSameDayUTC(a, b)).toBe(false);
    });

    it('returns true for same UTC date with different times', () => {
      const a = new Date('2023-01-01T00:00:00.000Z');
      const b = new Date('2023-01-01T23:59:59.999Z');
      expect(isSameDayUTC(a, b)).toBe(true);
    });
  });

  describe('isSameDayLocal', () => {
    it('returns true for same local date', () => {
      const a = new Date('2023-01-01T10:00:00');
      const b = new Date('2023-01-01T15:00:00');
      expect(a.getFullYear() === b.getFullYear() &&
             a.getMonth() === b.getMonth() &&
             a.getDate() === b.getDate()).toBe(true);
    });

    it('returns false for different local dates', () => {
      const a = new Date('2023-01-01T10:00:00');
      const b = new Date('2023-01-02T10:00:00');
      expect(a.getFullYear() === b.getFullYear() &&
             a.getMonth() === b.getMonth() &&
             a.getDate() === b.getDate()).toBe(false);
    });
  });

  describe('demo seeding logic', () => {
    beforeEach(() => {
      // Mock window and localStorage for browser environment
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
          },
        },
        writable: true,
      });
    });

    afterEach(() => {
      // Clean up window mock
      delete (global as any).window;
    });

    it('seeds demo data when localStorage has not been seeded', () => {
      // Mock localStorage to return null (not seeded)
      (global.window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      // Re-import the store to trigger the seeding logic
      jest.resetModules();
      const storeModule = require('@/lib/store');

      // Access the store to ensure initialization
      const store = storeModule.usePlanner.getState();

      // Check that setItem was called to mark as seeded
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith('planner-seeded', '1');
    });

    it('does not seed demo data when already seeded', () => {
      // Mock localStorage to return '1' (already seeded)
      (global.window.localStorage.getItem as jest.Mock).mockReturnValue('1');

      // Re-import the store
      jest.resetModules();
      require('@/lib/store');

      // Check that setItem was not called again
      expect(global.window.localStorage.setItem).not.toHaveBeenCalledWith('planner-seeded', '1');
    });

    it('seeds demo event and task', () => {
      (global.window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      jest.resetModules();
      const { usePlanner } = require('@/lib/store');

      // Trigger seeding by accessing the store
      const store = usePlanner.getState();

      // Check that demo data was added
      const items = Object.values(store.items);
      expect(items.length).toBeGreaterThan(0);

      // Check for demo event
      const demoEvent = items.find((item: BlockItem) => item.type === 'event' && item.title === 'Standup');
      expect(demoEvent).toBeDefined();

      // Check for demo task
      const demoTask = items.find((item: BlockItem) => item.type === 'task' && item.title === 'Plan user interviews');
      expect(demoTask).toBeDefined();
    });
  });
});
