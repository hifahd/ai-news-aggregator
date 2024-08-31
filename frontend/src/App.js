import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [news, setNews] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const response = await fetch('http://localhost:5000/api/news');
    const data = await response.json();
    setNews(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });
    if (response.ok) {
      setTitle('');
      setContent('');
      fetchNews();
    }
  };

  return (
    <div className="App">
      <h1>AI News Aggregator</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article Title"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Article Content"
          required
        />
        <button type="submit">Add Article</button>
      </form>
      <div className="news-container">
        {news.map((article, index) => (
          <div key={index} className="news-item">
            <h2>{article.title}</h2>
            <p>{article.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;