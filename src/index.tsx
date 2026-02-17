import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import Layout from "./Layout";
import ArticlesPage from "./pages/Articles";
import WordsPage from "./pages/Words";
import WordDetailPage from "./pages/WordDetail";
import VocabularyPage from "./pages/Vocabulary";
import "./index.css";

render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={ArticlesPage} />
      <Route path="/words" component={WordsPage} />
      <Route path="/words/:id" component={WordDetailPage} />
      <Route path="/vocabulary" component={VocabularyPage} />
    </Router>
  ),
  document.getElementById("root")!,
);
