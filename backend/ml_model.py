import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
_model = None

# ── SECTION 1: Generate data & train ─────────────────────────────────────────

def generate_data(n=100):
    np.random.seed(42)
    rows = []
    for _ in range(n):
        pct      = round(np.random.uniform(0, 100), 2)
        overdue  = int(np.random.randint(0, 6))        # 0–5
        days     = int(np.random.randint(1, 61))        # 1–60
        avg_days = round(np.random.uniform(1, 20), 2)  # 1–20

        if pct > 70 and overdue < 2:
            label = 'On Track'
        elif pct > 40:
            label = 'At Risk'
        else:
            label = 'Delayed'

        rows.append([pct, overdue, days, avg_days, label])

    return pd.DataFrame(
        rows,
        columns=['percent_complete', 'overdue_count', 'days_since_start',
                 'avg_days_to_complete', 'label']
    )


def train():
    df = generate_data(100)
    X = df[['percent_complete', 'overdue_count', 'days_since_start', 'avg_days_to_complete']]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    print(classification_report(y_test, clf.predict(X_test)))

    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return clf


# ── SECTION 2: predict() ─────────────────────────────────────────────────────

def load_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            _model = train()
    return _model


def predict(percent_complete, overdue_count, days_since_start, avg_days_to_complete):
    """Return predicted onboarding status label as a string."""
    model = load_model()
    features = np.array([[percent_complete, overdue_count, days_since_start, avg_days_to_complete]])
    return model.predict(features)[0]


if __name__ == '__main__':
    train()
