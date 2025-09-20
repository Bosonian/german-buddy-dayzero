"""
German Proficiency Level Classifier based on frequency and source
"""

def classify_proficiency_by_frequency(frequency: int) -> str:
    """
    Classify German proficiency level based on word/phrase frequency.
    Higher frequency = more common = lower proficiency level needed

    Based on linguistic research:
    - A1: Most frequent 500 words/phrases (survival German)
    - A2: Next 500 (basic communication)
    - B1: Next 1000 (intermediate conversation)
    - B2: Next 2000 (advanced conversation)
    - C1: Next 3000 (proficient)
    - C2: Rare/specialized (native-like)
    """
    if frequency >= 800:
        return "A1"  # Most common phrases
    elif frequency >= 500:
        return "A2"  # Common phrases
    elif frequency >= 200:
        return "B1"  # Intermediate phrases
    elif frequency >= 100:
        return "B2"  # Advanced phrases
    elif frequency >= 50:
        return "C1"  # Proficient level
    else:
        return "C2"  # Native/specialized

def classify_by_source(source: str) -> str:
    """
    Extract proficiency level from source name if available
    """
    source_lower = source.lower() if source else ""

    # Direct level extraction
    if "a1" in source_lower:
        return "A1"
    elif "a2" in source_lower:
        return "A2"
    elif "b1" in source_lower:
        return "B1"
    elif "b2" in source_lower:
        return "B2"
    elif "c1" in source_lower:
        return "C1"
    elif "c2" in source_lower:
        return "C2"

    # Source-based classification
    elif "100k" in source_lower:
        return "B1"  # Large corpus tends to be intermediate
    elif "frequency" in source_lower or "frequent" in source_lower:
        return "A2"  # Frequency-based usually targets beginners
    elif "verb" in source_lower or "preposition" in source_lower:
        return "B1"  # Grammar patterns are intermediate
    else:
        return "B1"  # Default to intermediate

def get_proficiency_level(item: dict) -> str:
    """
    Determine proficiency level for an item using multiple strategies
    """
    frequency = item.get('frequency', 0)
    source = item.get('source', '')

    # First try frequency-based classification
    if frequency > 0:
        return classify_proficiency_by_frequency(frequency)

    # Fallback to source-based classification
    return classify_by_source(source)