import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [news, setNews] = useState([]);
  const [categories] = useState(['technology', 'business', 'sports', 'entertainment', 'health']);
  const [selectedCategory, setSelectedCategory] = useState('technology');

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const fetchNews = async () => {
    const response = await fetch(`http://localhost:5000/api/news?q=${selectedCategory}`);
    const data = await response.json();
    setNews(data);
  };

  return (
    <div className="App">
      <h1>AI News Aggregator</h1>
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category, index) => (
            <option key={index} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
          ))}
        </select>
      </div>
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
    </div>
  );
}

export default App;