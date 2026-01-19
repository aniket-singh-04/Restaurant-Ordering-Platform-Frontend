import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MenuItemDetail from './pages/user/menu/MenuItemDetail';
import MenuHome from './pages/user/menu/MenuHome';
import MenuList from './pages/user/menu/MenuList';
import NotFound from './pages/not-found/NotFound';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MenuHome />,
  },
  {
    path: "/menu",
    element: <MenuList />,
  },
  {
    path: "/menu/:id",
    element: <MenuItemDetail />,
  },
  { path: "*", element: <NotFound /> },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App
