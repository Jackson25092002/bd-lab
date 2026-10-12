import { createHashRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { ReceptionProvider } from "./features/reception/ReceptionProvider";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { UploadPage } from "./features/upload/UploadPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { LedgerPage } from "./features/ledger/LedgerPage";
import { EmptyState } from "./shared/components/ui";
const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "upload", element: <UploadPage /> },
      { path: "review/:id?", element: <ReviewPage /> },
      { path: "ledger", element: <LedgerPage /> },
      {
        path: "*",
        element: (
          <EmptyState
            title="Không tìm thấy trang"
            description="Sử dụng menu bên trái để quay lại không gian làm việc."
          />
        ),
      },
    ],
  },
]);
export default function App() {
  return (
    <ReceptionProvider>
      <RouterProvider router={router} />
    </ReceptionProvider>
  );
}
