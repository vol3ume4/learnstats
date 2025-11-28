//student/page.js
import { Suspense } from "react";
import StudentClient from "./StudentClient";

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <StudentClient />
    </Suspense>
  );
}
