import { ChangeEvent, useRef, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ProgressSteps } from "../components/ProgressSteps";
import { cn } from "../components/ui/utils";
import { uploadPatientData } from "../lib/api";

type UploadStage = "idle" | "uploading" | "validating" | "processing" | "complete" | "error";
type StepStatus = "pending" | "active" | "completed";

export function UploadScreen() {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendLog = (message: string, isError = false) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    if (isError) {
      setErrorMessage(message);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const lowerCaseFileName = file.name.toLowerCase();
    if (![".csv", ".json"].some((extension) => lowerCaseFileName.endsWith(extension))) {
      appendLog("ERROR: Only CSV and JSON files are supported", true);
      setStage("error");
      return;
    }

    // Validate file size (100 MB max)
    if (file.size > 100 * 1024 * 1024) {
      appendLog("ERROR: File size exceeds 100 MB limit", true);
      setStage("error");
      return;
    }

    setStage("uploading");
    setLogs([]);
    setErrorMessage("");
    appendLog(`Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    appendLog(`Uploading to AWS API Gateway...`);

    try {
      const response = await uploadPatientData(file);
      setStage("validating");
      appendLog(`AWS response received: ${response.status}`);
      
      setStage("processing");
      appendLog(`Processing: ${response.message}`);
      
      if (response.eventId) {
        appendLog(`Event ID: ${response.eventId}`);
      }
      
      setStage("complete");
      appendLog(`✓ Upload completed successfully`);
    } catch (error) {
      setStage("error");
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      appendLog(`ERROR: Upload failed - ${errorMsg}`, true);
    }
  };

  const handleSelectedFile = (file?: File) => {
    if (!file) return;
    void handleFileUpload(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const getSteps = () => {
    const baseSteps = [
      { label: "Uploading", status: "pending" as StepStatus },
      { label: "Backend Validating", status: "pending" as StepStatus },
      { label: "Processing", status: "pending" as StepStatus },
    ];

    if (stage === "idle" || stage === "error") return baseSteps;

    if (stage === "uploading") {
      baseSteps[0].status = "active";
      return baseSteps;
    }

    if (stage === "validating") {
      baseSteps[0].status = "completed";
      baseSteps[1].status = "active";
      return baseSteps;
    }

    if (stage === "processing") {
      baseSteps[0].status = "completed";
      baseSteps[1].status = "completed";
      baseSteps[2].status = "active";
      return baseSteps;
    }

    if (stage === "complete") {
      baseSteps[0].status = "completed";
      baseSteps[1].status = "completed";
      baseSteps[2].status = "completed";
      return baseSteps;
    }

    return baseSteps;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Data Upload</h1>
        <p className="text-muted-foreground">
          Upload patient records for validation and ingestion
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card
            className={cn(
              "border-2 border-dashed transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleSelectedFile(event.dataTransfer.files[0]);
            }}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {stage === "complete" ? (
                  <CheckCircle className="w-10 h-10 text-teal" />
                ) : stage === "error" ? (
                  <AlertCircle className="w-10 h-10 text-risk" />
                ) : (
                  <Upload className="w-10 h-10 text-primary" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {stage === "complete"
                  ? "Upload Complete"
                  : stage === "error"
                  ? "Upload Failed"
                  : "Drop patient CSV/JSON here"}
              </h3>
              <p className="text-muted-foreground mb-6 text-center">
                Supported formats: CSV, JSON
                <br />
                Max file size: 100 MB
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={stage !== "idle" && stage !== "complete" && stage !== "error"}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="w-4 h-4 mr-2" />
                {stage === "error" ? "Try Again" : "Select File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </CardContent>
          </Card>

          {stage !== "idle" && (
            <Card className={cn("border-l-2", stage === "error" ? "border-l-risk" : "border-l-teal")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {stage === "error" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-risk" />
                      Error Details
                    </>
                  ) : (
                    "Upload Progress"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stage === "error" ? (
                  <p className="text-sm text-risk">{errorMessage}</p>
                ) : (
                  <ProgressSteps steps={getSteps()} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-black/20 border-teal/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm">Real-Time Log Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/40 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Waiting for file upload...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <p
                      key={index}
                      className={cn(
                        "text-foreground/80",
                        log.includes("✓") && "text-teal",
                        log.includes("ERROR") && "text-risk"
                      )}
                    >
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
