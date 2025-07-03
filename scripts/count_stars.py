import json
from collections import Counter
import matplotlib.pyplot as plt

# Load the card data from the JSON file
with open('../data/cards.json', 'r') as f:
    cards = json.load(f)

# Count how many cards have each level
level_counts = Counter(card.get("level") for card in cards if isinstance(card.get("level"), int))

# Print the counts
for level, count in sorted(level_counts.items()):
    print(f"{count} card(s) with level {level}")

# Prepare data for plotting
levels = sorted(level_counts.keys())
counts = [level_counts[level] for level in levels]

# Create the bar chart
plt.figure(figsize=(10, 6))
bars = plt.bar(levels, counts, color='skyblue', edgecolor='black')

# Add counts on top of each bar
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width() / 2, yval + 1, yval, ha='center', va='bottom')

# Labeling
plt.xlabel('Card Level')
plt.ylabel('Number of Cards')
plt.title('Number of Cards per Level')
plt.xticks(levels)  # Show all levels explicitly
plt.grid(axis='y', linestyle='--', alpha=0.7)

# Display the plot
plt.tight_layout()
plt.show()
