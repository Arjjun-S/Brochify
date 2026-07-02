import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Editor } from "@/features/editor/types";

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  editor: Editor | undefined;
}

export const BulkExportModal = ({ isOpen, onClose, certificateId, editor }: BulkExportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [format, setFormat] = useState<"pdf" | "png" | "jpg">("pdf");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const getPlaceholdersInUse = () => {
    const brochiObj = editor?.canvas?.getObjects().find(o => o.name === "brochitextbox") as any;
    if (brochiObj) {
      const text = brochiObj.originalText || brochiObj.text || "";
      const matches = text.match(/\{[a-zA-Z0-9_]+\}/g) || [];
      const extracted = Array.from(new Set(matches.map((m: string) => m.slice(1, -1))));
      if (extracted.length > 0) return extracted;
    }
    return ["salutation", "name", "year", "prize", "event", "date", "organization"];
  };

  const placeholders = getPlaceholdersInUse();
  const fileColumns = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];

  const initializeMapping = (rows: any[]) => {
    if (rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const initialMap: Record<string, string> = {};
    placeholders.forEach(pl => {
      const match = cols.find(c => c.toLowerCase() === pl.toLowerCase()) || "";
      initialMap[pl] = match;
    });
    setColumnMapping(initialMap);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setParsedRows([]);
    setColumnMapping({});

    try {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();

      if (extension === "csv") {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map((row: any) => {
              const normalizedRow: Record<string, string> = {};
              Object.entries(row).forEach(([key, val]) => {
                normalizedRow[key.trim().toLowerCase()] = String(val || "").trim();
              });
              return normalizedRow;
            });
            setParsedRows(data);
            initializeMapping(data);
            setParsing(false);
            toast.success(`Successfully parsed ${data.length} student rows!`);
          },
          error: (err) => {
            toast.error(`CSV parsing error: ${err.message}`);
            setParsing(false);
          }
        });
      } else if (extension === "json") {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const rawData = JSON.parse(event.target?.result as string);
            if (!Array.isArray(rawData)) {
              throw new Error("JSON must be an array of objects");
            }
            const data = rawData.map((row: any) => {
              const normalizedRow: Record<string, string> = {};
              Object.entries(row).forEach(([key, val]) => {
                normalizedRow[key.trim().toLowerCase()] = String(val || "").trim();
              });
              return normalizedRow;
            });
            setParsedRows(data);
            initializeMapping(data);
            toast.success(`Successfully parsed ${data.length} student rows!`);
          } catch (err: any) {
            toast.error(`JSON parsing error: ${err.message}`);
          } finally {
            setParsing(false);
          }
        };
        reader.readAsText(selectedFile);
      } else if (extension === "xlsx") {
        const rows = await readXlsxFile(selectedFile);
        if (rows.length < 2) {
          throw new Error("Excel sheet must contain a header row and at least one data row");
        }
        const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
        const data = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, colIndex) => {
            if (header) {
              obj[header] = row[colIndex] !== null && row[colIndex] !== undefined ? String(row[colIndex]).trim() : "";
            }
          });
          return obj;
        });
        setParsedRows(data);
        initializeMapping(data);
        setParsing(false);
        toast.success(`Successfully parsed ${data.length} student rows!`);
      } else {
        toast.error("Unsupported file format. Please upload CSV, JSON, or XLSX.");
        setFile(null);
        setParsing(false);
      }
    } catch (err: any) {
      toast.error(`File parsing error: ${err.message}`);
      setFile(null);
      setParsing(false);
    }
  };

  const handleExport = async () => {
    if (parsedRows.length === 0) {
      toast.error("No valid student rows to generate certificates for.");
      return;
    }

    setLoading(true);

    try {
      const mappedRows = parsedRows.map((row) => {
        const mapped: Record<string, string> = { ...row };
        Object.entries(columnMapping).forEach(([placeholder, fileHeader]) => {
          if (fileHeader) {
            mapped[placeholder] = row[fileHeader] || "";
          }
        });
        return mapped;
      });

      const response = await fetch(`/api/certificate/${certificateId}/bulk-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          rows: mappedRows,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "Generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificates-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Successfully generated and downloaded certificates ZIP!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Bulk generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Batch Certificate Export (Mail Merge)
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Upload student records to generate hundreds of personalized certificates containing unique verification QR codes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-300">Upload Data File (.csv, .json, .xlsx)</Label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40">
              <input
                type="file"
                accept=".csv,.json,.xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading || parsing}
              />
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                {parsing ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <span className="text-sm">Parsing file...</span>
                  </>
                ) : file ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    <span className="text-sm text-slate-200 font-semibold">{file.name}</span>
                    <span className="text-xs text-slate-400">
                      Parsed {parsedRows.length} student rows successfully!
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-500" />
                    <span className="text-sm font-medium">Click or drag data file to upload</span>
                    <span className="text-xs text-slate-500">CSV, JSON, or Excel sheets</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <Label className="text-xs font-semibold text-slate-300">Map placeholders to file columns:</Label>
              <div className="space-y-2">
                {placeholders.map((pl) => (
                  <div key={pl} className="flex items-center justify-between gap-x-4">
                    <span className="text-xs font-mono text-indigo-400 font-semibold">{`{${pl}}`}</span>
                    <select
                      value={columnMapping[pl] || ""}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [pl]: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white max-w-[200px] outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Ignore / Empty --</option>
                      {fileColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-lg text-[11px] leading-relaxed text-indigo-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <span className="font-bold">Expected Columns:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li><code className="text-white font-semibold">name</code>, <code className="text-white font-semibold">salutation</code>, <code className="text-white font-semibold">year</code>, <code className="text-white font-semibold">prize</code> (Required)</li>
                <li><code className="text-white font-semibold">event</code>, <code className="text-white font-semibold">date</code> (Optional - defaults to project fields if blank)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-300">Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["pdf", "png", "jpg"] as const).map((fmt) => {
                const isSelected = format === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer text-xs transition text-center",
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-white font-bold"
                        : "border-slate-800 hover:bg-slate-800/40 text-slate-400"
                    )}
                    disabled={loading || parsing}
                  >
                    <span className="font-bold text-sm uppercase">{fmt}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {fmt === "pdf" ? "Vector PDF" : fmt === "png" ? "HQ Image" : "Standard JPG"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleExport}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 font-bold text-sm py-5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition"
            disabled={loading || parsing || parsedRows.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {parsedRows.length} Certificates...
              </>
            ) : (
              `Generate & Download ZIP (${parsedRows.length} items)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
