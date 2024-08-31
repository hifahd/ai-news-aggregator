from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['news_aggregator']
news_collection = db['news_articles']

@app.route('/api/news', methods=['GET'])
def get_news():
    news = list(news_collection.find({}, {'_id': False}))
    return jsonify(news)

@app.route('/api/news', methods=['POST'])
def add_news():
    article = request.json
    result = news_collection.insert_one(article)
    return jsonify({"id": str(result.inserted_id)}), 201

@app.route('/api/test', methods=['GET'])
def add_test_data():
    test_article = {"title": "Test Article", "content": "This is a test article."}
    news_collection.insert_one(test_article)
    return jsonify({"message": "Test data added successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)