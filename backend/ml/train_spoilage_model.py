import pandas as pd
import re
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

# Loading and preprocessing the CSV
df = pd.read_csv("Wastage.csv")

# Cleaning data: Remove rows with missing loss_percentage
df = df.dropna(subset=["loss_percentage"])

# Extracting storage days from treatment (e.g., "30 days storage, no trapping" -> 30)
def extract_storage_days(treatment):
    if pd.isna(treatment):
        return 0
    match = re.search(r"(\d+)\s*days", treatment, re.IGNORECASE)
    return int(match.group(1)) if match else 0

df["storage_days"] = df["treatment"].apply(extract_storage_days)

# Selecting features and target
features = ["commodity", "activity", "food_supply_stage", "storage_days"]
X = df[features]
y = df["loss_percentage"]

# Preprocessing pipeline: One-hot encode categorical features, pass through numeric
preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["commodity", "activity", "food_supply_stage"]),
    ("num", "passthrough", ["storage_days"])
])

# Creating and training the model
model = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model.fit(X_train, y_train)

# Evaluating model
print("Model R^2 score:", model.score(X_test, y_test))

# Saving the model
joblib.dump(model, "spoilage_model.pkl")