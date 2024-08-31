from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['news_aggregator']
news_collection = db['news_articles']

# NewsAPI configuration
NEWS_API_KEY = 'a63624d4094f4949a89bcd7a7bf2018c'
NEWS_API_URL = 'https://newsapi.org/v2/everything'

def serialize_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: serialize_object_id(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_object_id(item) for item in obj]
    return obj

@app.route('/api/news', methods=['GET'])
def get_news():
    query = request.args.get('q', 'technology')
    page = int(request.args.get('page', 1))
    page_size = 10
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    skip = (page - 1) * page_size
    
    recent_news = list(news_collection.find({
        'query': query,
        'publishedAt': {'$gte': from_date}
    }).skip(skip).limit(page_size))
    
    total_results = news_collection.count_documents({
        'query': query,
        'publishedAt': {'$gte': from_date}
    })
    
    if recent_news:
        return jsonify({
            'articles': serialize_object_id(recent_news),
            'page': page,
            'totalResults': total_results
        })
    
    params = {
        'q': query,
        'from': from_date,
        'sortBy': 'publishedAt',
        'language': 'en',
        'apiKey': NEWS_API_KEY,
        'page': page,
        'pageSize': page_size
    }
    response = requests.get(NEWS_API_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        articles = data['articles']
        for article in articles:
            article['query'] = query
            news_collection.insert_one(article)
        return jsonify({
            'articles': articles,
            'page': page,
            'totalResults': data['totalResults']
        })
    else:
        return jsonify({'articles': [], 'page': page, 'totalResults': 0}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = ['technology', 'business', 'sports', 'entertainment', 'health']
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True)