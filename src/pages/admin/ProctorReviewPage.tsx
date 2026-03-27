import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/axios';
import { testService } from '@/services/test.service';
import { proctorService } from '@/services/proctor.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';

interface TestItem {
  id: string;
  title: string;
  status: string;
  isProctored: boolean;
  durationMins: number;
  createdAt: string;
}

interface StudentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  attemptId: string;
  totalEvents: number;
  flaggedEvents: number;
  tabSwitches: number;
  windowBlurs: number;
  screenshots: number;
  copyPastes: number;
  rightClicks: number;
}

interface ProctorEvent {
  id: string;
  eventType: string;
  screenshotUrl: string | null;
  metadata: any;
  flagged: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export default function ProctorReviewPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [events, setEvents] = useState<ProctorEvent[]>([]);
  const [screenshotDialog, setScreenshotDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch proctored tests
  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const allTests = await testService.getAll();
      setTests((Array.isArray(allTests) ? allTests : []).filter((t: TestItem) => t.isProctored) as TestItem[]);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  const loadSummary = async (test: TestItem) => {
    setSelectedTest(test);
    setSelectedStudent(null);
    setEvents([]);
    setLoading(true);
    try {
      const data = await proctorService.getTestSummary(test.id);
      setSummaries(Array.isArray(data) ? data as unknown as StudentSummary[] : []);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentEvents = async (student: StudentSummary) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const data = await proctorService.getStudentEvents(selectedTest!.id, student.userId);
      setEvents(Array.isArray(data) ? data as unknown as ProctorEvent[] : []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (eventId: string, currentFlagged: boolean) => {
    try {
      await proctorService.toggleFlag(eventId, { flagged: !currentFlagged });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, flagged: !currentFlagged } : e))
      );
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const eventTypeColors: Record<string, string> = {
    TAB_SWITCH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    WINDOW_BLUR: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    SCREENSHOT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    COPY_PASTE: 'bg-red-500/10 text-red-400 border-red-500/30',
    RIGHT_CLICK: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const eventTypeLabels: Record<string, string> = {
    TAB_SWITCH: 'Tab Switch',
    WINDOW_BLUR: 'Window Blur',
    SCREENSHOT: 'Screenshot',
    COPY_PASTE: 'Copy/Paste',
    RIGHT_CLICK: 'Right Click',
  };

  const filteredSummaries = summaries.filter(
    (s) =>
      !search ||
      s.userName?.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Proctor Review</h1>

        <div className="flex gap-6">
          {/* Left: Test list */}
          <div className="w-72 shrink-0">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Proctored Tests
            </h2>
            <div className="space-y-2">
              {tests.length === 0 && (
                <p className="text-sm text-zinc-500">No proctored tests found</p>
              )}
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => loadSummary(test)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedTest?.id === test.id
                      ? 'bg-blue-500/10 border-blue-500/30 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{test.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-400">
                      {test.status}
                    </Badge>
                    <span className="text-[10px] text-zinc-500">{test.durationMins}min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Content area */}
          <div className="flex-1 min-w-0">
            {!selectedTest && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-zinc-500 text-sm">Select a proctored test to review</p>
              </div>
            )}

            {selectedTest && !selectedStudent && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{selectedTest.title} - Student Summary</h2>
                  <Input
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full mx-auto" />
                  </div>
                ) : filteredSummaries.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <p className="text-zinc-500 text-sm">No proctor events recorded for this test</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSummaries.map((s) => (
                      <button
                        key={s.userId}
                        onClick={() => loadStudentEvents(s)}
                        className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{s.userName || 'Unknown'}</p>
                            <p className="text-xs text-zinc-500">{s.userEmail}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.flaggedEvents > 0 && (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                                {s.flaggedEvents} flagged
                              </Badge>
                            )}
                            <span className="text-sm font-semibold text-zinc-300">{s.totalEvents} events</span>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {s.tabSwitches > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                              {s.tabSwitches} tab switches
                            </span>
                          )}
                          {s.windowBlurs > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                              {s.windowBlurs} window blurs
                            </span>
                          )}
                          {s.copyPastes > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                              {s.copyPastes} copy/pastes
                            </span>
                          )}
                          {s.rightClicks > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                              {s.rightClicks} right clicks
                            </span>
                          )}
                          {s.screenshots > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                              {s.screenshots} screenshots
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTest && selectedStudent && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedStudent(null); setEvents([]); }}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer h-8 px-3 text-xs"
                  >
                    Back
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedStudent.userName || 'Unknown'}</h2>
                    <p className="text-xs text-zinc-500">{selectedStudent.userEmail} - {events.length} events</p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`bg-zinc-900 border rounded-lg p-4 flex items-start justify-between ${
                          event.flagged ? 'border-red-500/40' : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${eventTypeColors[event.eventType] || 'border-zinc-700 text-zinc-400'}`}>
                            {eventTypeLabels[event.eventType] || event.eventType}
                          </Badge>
                          <div>
                            <p className="text-xs text-zinc-400">
                              {new Date(event.createdAt).toLocaleTimeString()}
                            </p>
                            {event.metadata && (
                              <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
                                {typeof event.metadata === 'string' ? event.metadata : JSON.stringify(event.metadata)}
                              </p>
                            )}
                            {event.screenshotUrl && (
                              <button
                                onClick={() => setScreenshotDialog(`${API_BASE}${event.screenshotUrl}`)}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                              >
                                View Screenshot
                              </button>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFlag(event.id, event.flagged)}
                          className={`h-7 px-2 text-[10px] cursor-pointer ${
                            event.flagged
                              ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                              : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          {event.flagged ? 'Unflag' : 'Flag'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Dialog */}
      <Dialog open={!!screenshotDialog} onOpenChange={() => setScreenshotDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Screenshot</DialogTitle>
          </DialogHeader>
          {screenshotDialog && (
            <img
              src={screenshotDialog}
              alt="Proctor screenshot"
              className="w-full rounded-lg border border-zinc-800"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
