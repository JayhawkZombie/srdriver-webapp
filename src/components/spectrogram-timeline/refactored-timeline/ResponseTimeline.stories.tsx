import React from "react";
import { lazy } from "react";

const ResponseTimeline = lazy(() => import("./ResponseTimeline"));

export default {
  title: "RefactoredTimeline/ResponseTimeline",
  component: ResponseTimeline,
};

export const Basic = () => {
  if (typeof window === "undefined") return null;
  return (
    <React.Suspense fallback={<div>Loading…</div>}>
      <ResponseTimeline />
    </React.Suspense>
  );
}; 