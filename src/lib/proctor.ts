import { API_BASE, authFetch } from './api';

type ProctorEventType = 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'SCREENSHOT' | 'COPY_PASTE' | 'RIGHT_CLICK';

interface ProctorConfig {
  testAttemptId: string;
  maxViolations: number;
  onViolation?: (type: ProctorEventType, violationCount: number, remaining: number) => void;
  onAutoSubmit?: () => void;
  onScreenShareRejected?: () => void;
}

class ProctorMonitor {
  private config: ProctorConfig;
  private active = false;
  private violationCount = 0;
  private intentionalExit = false;

  // Screen capture
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private videoReady = false;

  // Periodic screenshots when not in fullscreen
  private screenshotInterval: ReturnType<typeof setInterval> | null = null;

  // Bound handlers for cleanup
  private handleFullscreenChange: () => void;
  private handleCopy: (e: ClipboardEvent) => void;
  private handlePaste: (e: ClipboardEvent) => void;
  private handleContextMenu: (e: MouseEvent) => void;

  constructor(config: ProctorConfig) {
    this.config = config;

    this.handleFullscreenChange = this._onFullscreenChange.bind(this);
    this.handleCopy = this._onCopy.bind(this);
    this.handlePaste = this._onPaste.bind(this);
    this.handleContextMenu = this._onContextMenu.bind(this);
  }

  async start() {
    if (this.active) return;
    this.active = true;

    // Request screen capture — force entire screen only
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as any,
        // Disable audio to simplify the prompt
        audio: false,
      } as any);

      // Verify user selected entire screen, not a tab or window
      const track = this.stream.getVideoTracks()[0];
      const settings = track?.getSettings() as any;
      if (settings?.displaySurface && settings.displaySurface !== 'monitor') {
        // User picked a tab or window — reject and ask again
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
        throw new Error('NOT_ENTIRE_SCREEN');
      }

      this.videoEl = document.createElement('video');
      this.videoEl.srcObject = this.stream;
      this.videoEl.muted = true;

      // Wait for video to actually be ready before marking it usable
      await new Promise<void>((resolve) => {
        this.videoEl!.onloadedmetadata = () => {
          this.videoEl!.play().then(() => {
            this.videoReady = true;
            resolve();
          }).catch(() => resolve());
        };
        // Timeout fallback in case metadata never fires
        setTimeout(resolve, 3000);
      });

      // Listen for the user stopping screen share via browser UI
      track?.addEventListener('ended', () => {
        this.stream = null;
        this.videoEl = null;
        this.videoReady = false;
      });
    } catch (err: any) {
      if (err?.message === 'NOT_ENTIRE_SCREEN') {
        // Retry — tell the user they must share entire screen
        this.active = false;
        this.config.onScreenShareRejected?.();
        return;
      }
      console.error('Screen capture permission denied:', err);
    }

    // Request fullscreen (skip if already in fullscreen from lobby)
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    }

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
    document.addEventListener('contextmenu', this.handleContextMenu);
  }

  stop() {
    if (!this.active) return;
    this.active = false;

    this.intentionalExit = true;

    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('contextmenu', this.handleContextMenu);

    // Stop periodic screenshots
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }

    // Stop screen capture stream — this removes the browser "sharing" indicator
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }
    this.videoReady = false;

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  getViolationCount() {
    return this.violationCount;
  }

  // ── Private handlers ──────────────────────────────────────────

  private async _onFullscreenChange() {
    // Fullscreen re-entered — stop periodic screenshots
    if (document.fullscreenElement) {
      if (this.screenshotInterval) {
        clearInterval(this.screenshotInterval);
        this.screenshotInterval = null;
      }
      return;
    }

    // Ignore if we triggered the exit intentionally (stop())
    if (this.intentionalExit) {
      this.intentionalExit = false;
      return;
    }

    if (!this.active) return;

    this.violationCount++;
    const remaining = this.config.maxViolations - this.violationCount;

    // Take screenshot immediately
    this.captureScreenshot();

    // Start periodic screenshots every 10s while not in fullscreen
    if (!this.screenshotInterval) {
      this.screenshotInterval = setInterval(() => {
        if (!document.fullscreenElement && this.active) {
          this.captureScreenshot();
        }
      }, 10000);
    }

    // Log event
    this.logEvent('FULLSCREEN_EXIT', { timestamp: Date.now(), violationCount: this.violationCount });

    // Notify callback
    this.config.onViolation?.('FULLSCREEN_EXIT', this.violationCount, remaining);

    // Check if max violations reached
    if (this.violationCount >= this.config.maxViolations) {
      this.config.onAutoSubmit?.();
      return;
    }

    // Re-request fullscreen after a short delay
    setTimeout(async () => {
      if (!this.active) return;
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Failed to re-enter fullscreen:', err);
      }
    }, 500);
  }

  private _onCopy(e: ClipboardEvent) {
    e.preventDefault();
    this.logEvent('COPY_PASTE', { action: 'copy', timestamp: Date.now() });
  }

  private _onPaste(e: ClipboardEvent) {
    e.preventDefault();
    this.logEvent('COPY_PASTE', { action: 'paste', timestamp: Date.now() });
  }

  private _onContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.logEvent('RIGHT_CLICK', { timestamp: Date.now() });
  }

  // ── API calls ────────────────────────────────────────────────

  private async logEvent(eventType: ProctorEventType, metadata?: any) {
    try {
      await authFetch(`${API_BASE}/proctor/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testAttemptId: this.config.testAttemptId,
          eventType,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to log proctor event:', err);
    }
  }

  private async captureScreenshot() {
    if (!this.stream || !this.videoEl || !this.videoReady) return;

    // Check stream is still active
    const track = this.stream.getVideoTracks()[0];
    if (!track || track.readyState !== 'live') return;

    try {
      // Ensure video has valid dimensions
      const vw = this.videoEl.videoWidth;
      const vh = this.videoEl.videoHeight;
      if (vw === 0 || vh === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = vw * 0.5;
      canvas.height = vh * 0.5;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.6);
      });
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, `screenshot-${Date.now()}.png`);
      formData.append('testAttemptId', this.config.testAttemptId);

      await authFetch(`${API_BASE}/proctor/screenshot`, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
    }
  }
}

export function createProctorMonitor(config: ProctorConfig): ProctorMonitor {
  return new ProctorMonitor(config);
}

export type { ProctorMonitor, ProctorConfig, ProctorEventType };
