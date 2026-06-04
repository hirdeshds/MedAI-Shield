import { useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="max-w-md p-8 text-center border-l-2 border-l-risk">
        <div className="w-16 h-16 bg-risk/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-risk" />
        </div>
        <h1 className="text-3xl font-semibold mb-2">404 Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}
