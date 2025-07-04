# AI News Aggregator Startup Guide

## Prerequisites
- MongoDB installed
- Python installed with Flask, Flask-CORS, and pymongo packages
- Node.js and npm installed

## Startup Steps

1. Start MongoDB:
   - Open a Command Prompt as Administrator
   - Run: `"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="c:\data\db"`
   - Keep this window open

2. Start the Flask Backend:
   - Open a new Command Prompt
   - Navigate to the backend directory: `cd path\to\your\project\backend`
   - Activate the virtual environment: `venv\Scripts\activate`
   - Run the Flask app: `python app.py`
   - Keep this window open

3. Start the React Frontend:
   - Open another new Command Prompt
   - Navigate to the frontend directory: `cd path\to\your\project\frontend`
   - Run: `npm start`
   - This will open the app in your default web browser

4. Use the Application:
   - The app should now be running at http://localhost:3000
   - You can add new articles and view existing ones

Note: Ensure all three components (MongoDB, Flask backend, and React frontend) are running simultaneously for the application to work properly.
