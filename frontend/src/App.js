import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [news, setNews] = useState([]);
  const [categories] = useState(['technology', 'business', 'sports', 'entertainment', 'health']);
  const [selectedCategory, setSelectedCategory] = useState('technology');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, page]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/news?q=${selectedCategory}&page=${page}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNews(data.articles || []); // Ensure we always set an array
      setTotalResults(data.totalResults);
    } catch (e) {
      console.error("There was a problem fetching the news:", e);
      setError("Failed to fetch news. Please try again later.");
      setNews([]); // Clear news on error
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
    setNews([]); // Clear existing news when changing category
  };

  return (
    <div className="App">
      <h1>AI News Aggregator</h1>
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          {categories.map((category, index) => (
            <option key={index} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="news-container">
        {news.map((article, index) => (
          <div key={index} className="news-item">
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer">Read more</a>
            <p className="source">Source: {article.source.name}</p>
            <p className="published-at">Published: {new Date(article.publishedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(prev => prev + 1)} disabled={news.length < 10}>
          Next
        </button>
      </div>
    </div>
  );
}

export default App;