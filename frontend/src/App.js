import React, { useState, useEffect } from 'react';
import Auth from './Auth';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchNews();
      fetchFavorites();
      fetchRecommendations();
    }
  }, [selectedCategory, page, isLoggedIn]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/news?q=${selectedCategory}&page=${page}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNews(data.articles || []);
      setTotalResults(data.totalResults);
    } catch (e) {
      console.error("There was a problem fetching the news:", e);
      setError(e.message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFavorites(data);
    } catch (e) {
      console.error("There was a problem fetching favorites:", e);
    }
  };

  const fetchRecommendations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/recommend', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (e) {
      console.error("There was a problem fetching recommendations:", e);
    }
  };

  const handleFavorite = async (article) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ article_id: article._id })
      });
      if (response.ok) {
        fetchFavorites();
        fetchRecommendations();
      }
    } catch (e) {
      console.error("There was a problem adding to favorites:", e);
    }
  };

  const handleRemoveFavorite = async (articleId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/favorite/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFavorites();
        fetchRecommendations();
      }
    } catch (e) {
      console.error("There was a problem removing from favorites:", e);
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

  const handleLogin = () => {
    setIsLoggedIn(true);
    fetchNews();
    fetchFavorites();
    fetchRecommendations();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setNews([]);
    setFavorites([]);
    setRecommendations([]);
  };

  const renderArticles = (articles) => {
    return articles.map((article, index) => (
      <div key={index} className="news-item">
        <h2>{article.title}</h2>
        <p>{article.description}</p>
        <a href={article.url} target="_blank" rel="noopener noreferrer">Read more</a>
        <p className="source">Source: {article.source.name}</p>
        <p className="published-at">Published: {new Date(article.publishedAt).toLocaleString()}</p>
        <p className="categories">Categories: {article.categories.join(', ')}</p>
        <p className="sentiment">Sentiment: {getSentimentEmoji(article.sentiment)}</p>
        <button onClick={() => handleFavorite(article)}>
          {favorites.some(fav => fav._id === article._id) ? '★' : '☆'} Favorite
        </button>
      </div>
    ));
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment > 0.05) return '😊';
    if (sentiment < -0.05) return '😟';
    return '😐';
  };

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <h1>AI News Aggregator</h1>
      <button onClick={handleLogout} className="logout-button">Logout</button>
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
        <button onClick={() => setShowFavorites(!showFavorites)}>
          {showFavorites ? 'Show All News' : 'Show Favorites'}
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>Recommended for you:</h2>
          {renderArticles(recommendations)}
        </div>
      )}
      <div className="news-container">
        {showFavorites ? renderArticles(favorites) : renderArticles(news)}
      </div>
      {!showFavorites && (
        <div className="pagination">
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage(prev => prev + 1)} disabled={news.length < 10}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;