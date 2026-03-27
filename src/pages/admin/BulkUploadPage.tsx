import { useState, useRef, useCallback } from 'react';
import { bulkUploadService } from '@/services/bulk-upload.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UploadResultRow {
  row: number;
  email: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

interface UploadError {
  row: number;
  message: string;
}

interface UploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: UploadError[];
  details: UploadResultRow[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Template Download ────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const blob = await bulkUploadService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please select a .csv or .xlsx file');
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // ─── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    try {
      setUploadProgress(30);
      const data = await bulkUploadService.uploadStudents(file);
      setUploadProgress(80);
      setResult(data as unknown as UploadResult);
      setUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Upload Students</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Upload a CSV or Excel file to create student accounts in bulk.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </>
            )}
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Upload area */}
        {!result && (
          <div className="space-y-6">
            {/* Drag and drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
                ${dragOver
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/30'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div className={`rounded-full p-3 ${dragOver ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
                  <svg className={`h-8 w-8 ${dragOver ? 'text-blue-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">
                    {file ? (
                      <span className="text-blue-400 font-medium">{file.name}</span>
                    ) : (
                      <>
                        <span className="text-blue-400 font-medium">Drop your file here</span>
                        {' '}or click to browse
                      </>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Supports .csv and .xlsx files
                  </p>
                </div>
              </div>
            </div>

            {/* Upload progress & button */}
            {file && (
              <div className="space-y-4">
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Uploading...</span>
                      <span className="text-zinc-400">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Upload File'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={resetUpload}
                    disabled={uploading}
                    className="text-zinc-400 hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results section */}
        {result && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Rows</p>
                  <p className="text-2xl font-bold text-white mt-1">{result.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <p className="text-xs text-green-500 uppercase tracking-wider">Created</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{result.created}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <p className="text-xs text-amber-500 uppercase tracking-wider">Skipped</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{result.skipped}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <p className="text-xs text-red-500 uppercase tracking-wider">Errors</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{result.errors.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Details table */}
            {result.details && result.details.length > 0 && (
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Row #</TableHead>
                      <TableHead className="text-zinc-400">Email</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.details.map((row, idx) => (
                      <TableRow key={idx} className="border-zinc-800 hover:bg-zinc-900/50">
                        <TableCell className="text-zinc-400">{row.row}</TableCell>
                        <TableCell className="font-medium text-white">{row.email}</TableCell>
                        <TableCell>
                          {row.status === 'created' && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                              Created
                            </Badge>
                          )}
                          {row.status === 'skipped' && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                              Skipped
                            </Badge>
                          )}
                          {row.status === 'error' && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {row.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Upload another */}
            <div className="flex items-center gap-3">
              <Button
                onClick={resetUpload}
                className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
              >
                Upload Another File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
