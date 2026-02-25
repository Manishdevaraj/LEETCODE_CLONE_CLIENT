// @ts-nocheck
//@ts-ignore
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QuestionsPage from "./pages/QuestionsPage";
import Playground from "./pages/Playground";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuestionsPage />} />
        <Route path="/playground/:questionId" element={<Playground />} />
      </Routes>
    </Router>
  );
}

export default App;
