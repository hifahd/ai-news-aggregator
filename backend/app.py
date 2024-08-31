from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['news_aggregator']
news_collection = db['news_articles']

# NewsAPI configuration
NEWS_API_KEY = 'a63624d4094f4949a89bcd7a7bf2018c'  # Replace with your actual API key
NEWS_API_URL = 'https://newsapi.org/v2/everything'

@app.route('/api/news', methods=['GET'])
def get_news():
    # Get parameters for filtering
    query = request.args.get('q', 'technology')  # Default to technology news
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')  # Last 7 days
    
    # Check if we have recent news in our database
    recent_news = list(news_collection.find({
        'query': query,
        'publishedAt': {'$gte': from_date}
    }))
    
    if recent_news:
        return jsonify(recent_news)
    
    # If no recent news, fetch from API
    params = {
        'q': query,
        'from': from_date,
        'sortBy': 'publishedAt',
        'language': 'en',
        'apiKey': NEWS_API_KEY
    }
    response = requests.get(NEWS_API_URL, params=params)
    if response.status_code == 200:
        articles = response.json()['articles']
        # Store in MongoDB and return
        for article in articles:
            article['query'] = query
            news_collection.insert_one(article)
        return jsonify(articles)
    else:
        return jsonify({'error': 'Failed to fetch news'}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    # For simplicity, we'll use predefined categories
    categories = ['technology', 'business', 'sports', 'entertainment', 'health']
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True)