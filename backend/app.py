from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson import ObjectId
import requests
from datetime import datetime, timedelta
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['news_aggregator']
news_collection = db['news_articles']
users_collection = db['users']
favorites_collection = db['favorites']

# NewsAPI configuration
NEWS_API_KEY = 'a63624d4094f4949a89bcd7a7bf2018c'
NEWS_API_URL = 'https://newsapi.org/v2/everything'

# NLP setup
nltk.download('vader_lexicon')
sia = SentimentIntensityAnalyzer()
nlp = spacy.load("en_core_web_sm")

def serialize_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: serialize_object_id(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_object_id(item) for item in obj]
    return obj

def categorize_article(text):
    doc = nlp(text)
    return [ent.label_ for ent in doc.ents if ent.label_ in ['ORG', 'PERSON', 'GPE', 'EVENT']]

def analyze_sentiment(text):
    return sia.polarity_scores(text)['compound']

def preprocess_text(text):
    doc = nlp(text.lower())
    return ' '.join([token.lemma_ for token in doc if not token.is_stop and not token.is_punct])

vectorizer = TfidfVectorizer()

@app.route('/api/register', methods=['POST'])
def register():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400
    if users_collection.find_one({"username": username}):
        return jsonify({"msg": "Username already exists"}), 400
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection.insert_one({"username": username, "password": hashed_password})
    return jsonify({"msg": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    user = users_collection.find_one({"username": username})
    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Bad username or password"}), 401

@app.route('/api/news', methods=['GET'])
@jwt_required()
def get_news():
    query = request.args.get('q', 'technology')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    page_size = 10
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    skip = (page - 1) * page_size
    
    mongo_query = {
        'query': query,
        'publishedAt': {'$gte': from_date}
    }
    
    if search:
        mongo_query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    recent_news = list(news_collection.find(mongo_query).skip(skip).limit(page_size))
    
    for article in recent_news:
        article['categories'] = categorize_article(article['description'])
        article['sentiment'] = analyze_sentiment(article['description'])
    
    total_results = news_collection.count_documents(mongo_query)
    
    if recent_news:
        return jsonify({
            'articles': serialize_object_id(recent_news),
            'page': page,
            'totalResults': total_results
        })
    
    params = {
        'q': f"{query} {search}".strip(),
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
            article['categories'] = categorize_article(article['description'])
            article['sentiment'] = analyze_sentiment(article['description'])
            news_collection.insert_one(article)
        return jsonify({
            'articles': serialize_object_id(articles),
            'page': page,
            'totalResults': data['totalResults']
        })
    else:
        return jsonify({'articles': [], 'page': page, 'totalResults': 0}), 500

@app.route('/api/favorite', methods=['POST'])
@jwt_required()
def add_favorite():
    current_user = get_jwt_identity()
    article_id = request.json.get('article_id')
    
    if not article_id:
        return jsonify({"msg": "Missing article_id"}), 400
    
    favorite = favorites_collection.find_one({
        "username": current_user,
        "article_id": article_id
    })
    
    if favorite:
        return jsonify({"msg": "Article already in favorites"}), 400
    
    favorites_collection.insert_one({
        "username": current_user,
        "article_id": article_id,
        "added_at": datetime.utcnow()
    })
    
    return jsonify({"msg": "Article added to favorites"}), 201

@app.route('/api/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    current_user = get_jwt_identity()
    favorites = list(favorites_collection.find({"username": current_user}))
    
    favorite_articles = []
    for favorite in favorites:
        article = news_collection.find_one({"_id": ObjectId(favorite['article_id'])})
        if article:
            article['_id'] = str(article['_id'])
            favorite_articles.append(article)
    
    return jsonify(favorite_articles)

@app.route('/api/favorite/<article_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(article_id):
    current_user = get_jwt_identity()
    result = favorites_collection.delete_one({
        "username": current_user,
        "article_id": article_id
    })
    
    if result.deleted_count:
        return jsonify({"msg": "Article removed from favorites"}), 200
    else:
        return jsonify({"msg": "Article not found in favorites"}), 404

@app.route('/api/recommend', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user = get_jwt_identity()
    user_favorites = list(favorites_collection.find({"username": current_user}))
    
    if not user_favorites:
        return jsonify([])
    
    favorite_articles = [news_collection.find_one({"_id": ObjectId(fav['article_id'])}) for fav in user_favorites]
    favorite_texts = [preprocess_text(article['description']) for article in favorite_articles if article]
    
    all_articles = list(news_collection.find({}))
    all_texts = [preprocess_text(article['description']) for article in all_articles]
    
    tfidf_matrix = vectorizer.fit_transform(all_texts + favorite_texts)
    cosine_similarities = cosine_similarity(tfidf_matrix[-len(favorite_texts):], tfidf_matrix[:-len(favorite_texts)])
    
    similar_indices = cosine_similarities.argsort()[0][-5:][::-1]
    recommended_articles = [serialize_object_id(all_articles[i]) for i in similar_indices]
    
    return jsonify(recommended_articles)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = ['technology', 'business', 'sports', 'entertainment', 'health']
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True)