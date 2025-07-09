import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import HomePage from '../pages/HomePage';
import GradePage from '../pages/GradePage';
import StudentsPage from '../pages/StudentsPage';
import EvaluationPage from '../pages/EvaluationPage';
import ConfigPage from '../pages/ConfigPage';
import HelpPage from '../pages/HelpPage';

// Placeholder components for now
const NotFoundPage = () => <div>404 Not Found</div>;

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <NotFoundPage />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'grade/:gradeId',
                element: <GradePage />,
            },
            {
                path: 'grade/:gradeId/students',
                element: <StudentsPage />,
            },
            {
                path: 'grade/:classroomId/matrix/:matrixId/evaluate',
                element: <EvaluationPage />,
            },
            {
                path: 'config',
                element: <ConfigPage />,
            },
            {
                path: 'help',
                element: <HelpPage />,
            },
        ],
    },
]);

const Router = () => {
    return (
        <RouterProvider router={router} />
    );
};

export default Router
