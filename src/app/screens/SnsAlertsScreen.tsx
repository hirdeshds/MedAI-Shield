import { FormEvent, useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Loader2, RefreshCw, Send, ShieldAlert, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  getSnsStatus,
  publishSnsAlert,
  subscribeToSns,
  type SnsStatus,
} from "../lib/api";

export function SnsAlertsScreen() {
  const [status, setStatus] = useState<SnsStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState<"email" | "sms">("email");
  const [endpoint, setEndpoint] = useState("");
  const [subject, setSubject] = useState("MedAI Shield Critical Alert");
  const [message, setMessage] = useState(
    "A high-risk patient data event requires admin review in MedAI Shield.",
  );
  const [subscribeResult, setSubscribeResult] = useState("");
  const [publishResult, setPublishResult] = useState("");
  const [submittingSubscribe, setSubmittingSubscribe] = useState(false);
  const [submittingPublish, setSubmittingPublish] = useState(false);

  const canUseSns = true;
  const maskedTopicArn = useMemo(() => {
    if (!status?.topicArn) return "Not configured";
    const parts = status.topicArn.split(":");
    return parts.length > 2 ? `${parts.slice(0, 5).join(":")}:...:${parts[parts.length - 1]}` : status.topicArn;
  }, [status?.topicArn]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setStatusError("");
      setStatus(await getSnsStatus());
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to load SNS status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribeResult("");
    setSubmittingSubscribe(true);

    try {
      const response = await subscribeToSns({ protocol, endpoint });
      setSubscribeResult(
        response.subscriptionArn === "pending confirmation"
          ? "Confirmation sent. The subscriber must confirm before receiving alerts."
          : "Subscriber connected to the SNS topic.",
      );
      setEndpoint("");
    } catch (error) {
      setSubscribeResult(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setSubmittingSubscribe(false);
    }
  };

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublishResult("");
    setSubmittingPublish(true);

    try {
      const response = await publishSnsAlert({ subject, message });
      setPublishResult(`Alert published${response.messageId ? `: ${response.messageId}` : "."}`);
    } catch (error) {
      setPublishResult(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setSubmittingPublish(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">SNS Alerts</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage admin notifications for critical MedAI Shield events.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={loadStatus} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
              <BellRing className="h-4 w-4 text-blue-600" />
              Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-slate-950">{status?.service ?? "Amazon SNS"}</p>
            <Badge className="mt-3" variant={canUseSns ? "default" : "outline"}>
              {status?.configured ? "Topic configured" : "Preview mode"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Region</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-slate-950">{status?.region ?? "ap-south-1"}</p>
            <p className="mt-3 text-xs text-slate-500">Loaded from frontend-safe config.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-sm text-slate-950">{maskedTopicArn}</p>
            <p className="mt-3 text-xs text-slate-500">
              Access keys are not stored in the browser bundle.
            </p>
          </CardContent>
        </Card>
      </div>

      {(statusError || !status?.configured) && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>SNS preview mode</AlertTitle>
          <AlertDescription>
            {statusError ||
              "Set VITE_AWS_REGION and VITE_AWS_SNS_TOPIC_ARN for display only. Do not put AWS secret keys in frontend .env."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Add Subscriber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubscribe}>
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Channel</Label>
                  <select
                    id="protocol"
                    value={protocol}
                    onChange={(event) => setProtocol(event.target.value as "email" | "sms")}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(event) => setEndpoint(event.target.value)}
                    placeholder={protocol === "email" ? "admin@hospital.com" : "+919999999999"}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={!canUseSns || submittingSubscribe}>
                {submittingSubscribe ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Subscribe
              </Button>
              {subscribeResult && <p className="text-sm text-slate-600">{subscribeResult}</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send Test Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePublish}>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={!canUseSns || submittingPublish}>
                {submittingPublish ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish alert
              </Button>
              {publishResult && <p className="text-sm text-slate-600">{publishResult}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
