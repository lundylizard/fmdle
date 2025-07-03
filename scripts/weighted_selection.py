import random
import matplotlib.pyplot as plt
from collections import Counter

# Card level distribution based on earlier data
level_distribution = {
    0: 101,
    1: 31,
    2: 91,
    3: 157,
    4: 156,
    5: 92,
    6: 51,
    7: 27,
    8: 13,
    9: 1,
    11: 1,
    12: 1
}

# Build the card pool
cards = []
for level, count in level_distribution.items():
    cards.extend([{'level': level}] * count)

# Split cards into low (≤4) and high (>4) level groups
low_level_cards = [card for card in cards if card['level'] <= 4]
high_level_cards = [card for card in cards if card['level'] > 4]

# Simulate 100,000 selections using 25% chance for high-level cards
num_trials = 100_000
selected_levels = []

for _ in range(num_trials):
    if random.random() < 0.25 and high_level_cards:
        chosen = random.choice(high_level_cards)
    else:
        chosen = random.choice(low_level_cards)
    selected_levels.append(chosen['level'])

# Count and plot selection frequency
selection_counts = Counter(selected_levels)
levels = sorted(selection_counts.keys())
frequencies = [selection_counts[level] for level in levels]

plt.figure(figsize=(10, 6))
bars = plt.bar(levels, frequencies, color='lightgreen', edgecolor='black')

for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width() / 2, height + 500, f"{height:,}", ha='center', fontsize=8)

plt.xlabel('Card Level')
plt.ylabel('Times Selected in Simulation')
plt.title('Simulated Frequency of Card Selection by Level (25% > Level 4)')
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
plt.show()