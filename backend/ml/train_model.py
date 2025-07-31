import pandas as pd
import os


def load_food_loss_data():
    data_path = "D:/SmartInvo/backend/data/Wastage.csv"
    df = pd.read_csv(data_path)

    # Clean up column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

    # Drop rows without commodity or loss_percentage
    df = df.dropna(subset=['commodity', 'loss_percentage'])

    # Standardize commodity names (e.g., remove extra whitespace)
    df['commodity'] = df['commodity'].str.strip().str.lower()

    return df


def get_average_loss_by_commodity():
    df = load_food_loss_data()
    avg_loss = df.groupby('commodity')['loss_percentage'].mean().reset_index()
    avg_loss = avg_loss.sort_values(by='loss_percentage', ascending=False)
    return avg_loss


if __name__ == '__main__':
    print("Average Food Loss by Commodity:")
    print(get_average_loss_by_commodity().head(10))
