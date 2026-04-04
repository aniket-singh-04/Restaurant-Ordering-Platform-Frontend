import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import AppProviders from "./app/AppProviders";
import { router } from "./app/router";
import FullPageLoader from "./components/FullPageLoader";

function App() {
  return (
    <AppProviders>
      <Suspense fallback={<FullPageLoader label="Loading page..." />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}

export default App;
