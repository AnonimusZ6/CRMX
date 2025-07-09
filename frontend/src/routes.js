import { createBrowserRouter } from 'react-router-dom';
// import Layout from './components/Layout';
// import Home from './pages/Home';
import LoginComponent from "./Components/LoginComponent";

import DashboardComponent from './Components/DashboardComponent';
// import ErrorPage from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    // element: <Layout />,
    // errorElement: <ErrorPage />,
    children: [
    //   {
    //     index: true,
    //     element: <Home />,
    //   },
      {
        path: 'login',
        element: <LoginComponent />,
      },
       {
         path: 'dashboard',
         element: <DashboardComponent />,
       },
        {
        path: "chat",
        element: <ChatComponent />,
      },
    ],
  },
]);