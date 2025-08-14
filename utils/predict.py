import sys
import json
import joblib
import re
import pandas as pd
import contractions
from textblob import TextBlob
import scipy.sparse as sp
import numpy as np

# Lo
# ad saved assets
try:
    rf_model = joblib.load('./utils/Random_Forest_model.pkl')
    tfidf_vectorizer = joblib.load('./utils/tfidf_vectorizer.pkl')
except Exception as e:
    print(json.dumps({"error": f"Error loading model/vectorizer: {str(e)}"}))
    sys.exit(1)

# Text Cleaning (must match training preprocessing)
def enhanced_clean_text(text):
    text = contractions.fix(text)  # Expand contractions
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)  # Remove URLs
    text = re.sub(r'<.*?>|&\w+;', '', text)  # Remove HTML
    text = re.sub(r'[^\w\s\.\!\?]', '', text)  # Keep sentence-ending punctuation
    text = re.sub(r'(.)\1+', r'\1', text)  # Normalize repeated characters
    text = re.sub(r'\b\d+\b', '', text)  # Remove standalone numbers
    return text.strip().lower()

# Feature calculation for single text
def calculate_features(text):
    return {
        'text_length': len(text),
        'sentiment': TextBlob(text).sentiment.polarity,
        'exclamation_count': text.count('!')
    }

def predict_text(text):
    cleaned_text = enhanced_clean_text(text)
    features = calculate_features(cleaned_text)
    tfidf_features = tfidf_vectorizer.transform([cleaned_text])

    numerical_features = np.array([
        features['text_length'],
        features['sentiment'],
        features['exclamation_count']
    ]).reshape(1, -1)

    combined_features = sp.hstack([tfidf_features, sp.csr_matrix(numerical_features)], format='csr')

    prediction = rf_model.predict(combined_features)[0]
    probability = rf_model.predict_proba(combined_features)[0]

    return prediction, probability

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            input_text = sys.argv[1]
            pred, prob = predict_text(input_text)

            result = {
                "prediction": "Fake" if pred == 1 else "Genuine",
                "confidence": round(float(max(prob)), 2)
            }
            print(json.dumps(result))  # Proper JSON output for Node
            
        else:
            print(json.dumps({"error": "No input text provided"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Runtime error: {str(e)}"}))
        sys.exit(1)
