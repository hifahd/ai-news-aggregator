import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [news, setNews] = useState([]);
  const [categories] = useState(['technology', 'business', 'sports', 'entertainment', 'health']);
  const [selectedCategory, setSelectedCategory] = useState('technology');
  const [searchTerm, setSearchTerm] = useState('');
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
      const response = await fetch(`http://localhost:5000/api/news?q=${selectedCategory}&page=${page}&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNews(data.articles || []);
      setTotalResults(data.totalResults);
    } catch (e) {
      console.error("There was a problem fetching the news:", e);
      setError("Failed to fetch news. Please try again later.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
    setSearchTerm('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNews();
  };

  return (
    <div className="App">
      <h1>AI News Aggregator</h1>
      <div className="controls">
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
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news..."
          />
          <button type="submit">Search</button>
        </form>
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