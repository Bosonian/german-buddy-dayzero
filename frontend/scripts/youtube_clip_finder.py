#!/usr/bin/env python3
"""
YouTube Clip Finder for German Buddy
Finds authentic German video clips for collocations and phrases
"""

import json
import time
import os
import sys
from typing import List, Dict, Optional
import pandas as pd

try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("Please install google-api-python-client:")
    print("pip install google-api-python-client")
    sys.exit(1)

class GermanClipFinder:
    def __init__(self, api_key: str):
        """Initialize YouTube API client"""
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.cache_file = 'german_youtube_clips.json'
        self.load_cache()

    def load_cache(self):
        """Load existing cache to avoid re-fetching"""
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                self.cache = json.load(f)
        except FileNotFoundError:
            self.cache = {}

    def save_cache(self):
        """Save cache to file"""
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, indent=2, ensure_ascii=False)

    def find_clips_for_phrase(self, phrase: str, limit: int = 3) -> List[Dict]:
        """Find YouTube clips containing German phrase"""

        # Check cache first
        if phrase in self.cache:
            print(f"  Using cached result for: {phrase}")
            return self.cache[phrase]

        # Define search strategies
        search_queries = [
            f'"{phrase}" German movie scene',
            f'"{phrase}" deutsche Filme Szene',
            f'{phrase} German with subtitles',
            f'"{phrase}" Deutsch lernen',
            f'{phrase} German dialogue'
        ]

        all_videos = []

        for query in search_queries:
            try:
                print(f"    Searching: {query}")

                request = self.youtube.search().list(
                    q=query,
                    part='snippet',
                    type='video',
                    videoDuration='short',  # Under 4 minutes
                    relevanceLanguage='de',
                    regionCode='DE',  # German region
                    maxResults=3,
                    order='relevance'
                )

                response = request.execute()

                for item in response['items']:
                    video_data = {
                        'video_id': item['id']['videoId'],
                        'title': item['snippet']['title'],
                        'description': item['snippet']['description'][:200],
                        'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                        'channel': item['snippet']['channelTitle'],
                        'published': item['snippet']['publishedAt'],
                        'url': f"https://youtube.com/watch?v={item['id']['videoId']}",
                        'search_query': query,
                        'confidence': self.calculate_confidence(phrase, item)
                    }
                    all_videos.append(video_data)

                # Respect API rate limits
                time.sleep(0.5)

            except HttpError as e:
                print(f"    API Error: {e}")
                time.sleep(2)
            except Exception as e:
                print(f"    Error: {e}")

        # Sort by confidence and deduplicate
        unique_videos = {}
        for video in all_videos:
            vid_id = video['video_id']
            if vid_id not in unique_videos or video['confidence'] > unique_videos[vid_id]['confidence']:
                unique_videos[vid_id] = video

        # Get top results
        sorted_videos = sorted(unique_videos.values(), key=lambda x: x['confidence'], reverse=True)
        result = sorted_videos[:limit]

        # Cache result
        self.cache[phrase] = result
        self.save_cache()

        return result

    def calculate_confidence(self, phrase: str, video_item: Dict) -> float:
        """Calculate confidence score for video relevance"""
        title = video_item['snippet']['title'].lower()
        description = video_item['snippet']['description'].lower()
        phrase_lower = phrase.lower()

        score = 0.0

        # Exact phrase match in title (high value)
        if phrase_lower in title:
            score += 10.0

        # Phrase words in title
        phrase_words = phrase_lower.split()
        title_word_matches = sum(1 for word in phrase_words if word in title)
        score += title_word_matches * 3.0

        # Description matches
        desc_word_matches = sum(1 for word in phrase_words if word in description)
        score += desc_word_matches * 1.0

        # German language indicators
        german_indicators = ['deutsch', 'german', 'filme', 'szene', 'dialog', 'sprechen']
        indicator_matches = sum(1 for indicator in german_indicators if indicator in title + description)
        score += indicator_matches * 2.0

        # Bonus for educational channels
        educational_channels = ['deutsch', 'german', 'learn', 'lernen', 'lesson']
        channel = video_item['snippet']['channelTitle'].lower()
        if any(edu in channel for edu in educational_channels):
            score += 5.0

        return score

    def process_collocations(self, csv_path: str, max_phrases: int = 100):
        """Process collocations from CSV file"""

        try:
            df = pd.read_csv(csv_path)
            print(f"Loaded {len(df)} collocations from {csv_path}")
        except FileNotFoundError:
            print(f"Error: Could not find {csv_path}")
            return {}

        # Get top phrases by frequency
        if 'frequency' in df.columns:
            top_phrases = df.nlargest(max_phrases, 'frequency')
        else:
            top_phrases = df.head(max_phrases)

        print(f"Processing top {len(top_phrases)} phrases...")

        for idx, row in top_phrases.iterrows():
            phrase = row['german']
            frequency = row.get('frequency', 0)

            print(f"\n[{idx+1}/{len(top_phrases)}] {phrase} (freq: {frequency})")

            clips = self.find_clips_for_phrase(phrase)

            if clips:
                print(f"  ✓ Found {len(clips)} clips")
                for i, clip in enumerate(clips[:2]):  # Show top 2
                    print(f"    {i+1}. {clip['title'][:60]}... (score: {clip['confidence']:.1f})")
            else:
                print(f"  ✗ No clips found")

            # Save progress every 10 phrases
            if (idx + 1) % 10 == 0:
                print(f"\n💾 Saving progress... ({len(self.cache)} phrases cached)")
                self.save_cache()

        print(f"\n✅ Completed! Found clips for {len([p for p in self.cache.values() if p])} phrases")
        return self.cache

def main():
    """Main function"""

    # Get API key from environment
    api_key = os.getenv('YOUTUBE_API_KEY')
    if not api_key:
        print("Error: Please set YOUTUBE_API_KEY environment variable")
        print("Get your key from: https://console.cloud.google.com")
        sys.exit(1)

    # Initialize finder
    finder = GermanClipFinder(api_key)

    # Look for collocations CSV
    csv_path = '../public/collocations_extracted.csv'
    if not os.path.exists(csv_path):
        csv_path = 'collocations_extracted.csv'

    if not os.path.exists(csv_path):
        print("Error: Could not find collocations_extracted.csv")
        print("Please ensure the file is in the current directory or ../public/")
        sys.exit(1)

    # Process collocations
    result = finder.process_collocations(csv_path, max_phrases=50)  # Start with 50

    # Show summary
    total_phrases = len(result)
    phrases_with_clips = len([p for p in result.values() if p])

    print(f"""
🎬 YouTube Clip Finder - Summary
================================
Total phrases processed: {total_phrases}
Phrases with clips found: {phrases_with_clips}
Success rate: {phrases_with_clips/total_phrases*100:.1f}%

Cache saved to: {finder.cache_file}
Ready for integration with German Buddy PWA!
""")

if __name__ == "__main__":
    main()