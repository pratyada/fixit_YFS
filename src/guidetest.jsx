import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ExerciseGuide from './pages/ExerciseGuide';

createRoot(document.getElementById('root')).render(
  <MemoryRouter initialEntries={['/guide/squat']}>
    <Routes>
      <Route path="/guide/:exerciseId" element={<ExerciseGuide />} />
    </Routes>
  </MemoryRouter>
);
