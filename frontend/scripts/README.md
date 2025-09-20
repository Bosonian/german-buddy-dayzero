# YouTube API Integration for German Buddy

This guide shows how to set up YouTube API integration to find authentic German clips for your collocations.

## Prerequisites

1. **Google Cloud Account**: You need access to Google Cloud Console
2. **YouTube Data API v3**: Must be enabled for your project
3. **API Key**: For accessing YouTube search

## Step 1: Set Up Google Cloud Project

```bash
# Install gcloud CLI if needed
curl https://sdk.cloud.google.com | bash

# Login to Google Cloud
gcloud auth login

# Create new project (or use existing)
gcloud projects create german-buddy-youtube --name="German Buddy YouTube"

# Set as active project
gcloud config set project german-buddy-youtube

# Enable YouTube Data API v3
gcloud services enable youtube.googleapis.com
```

## Step 2: Create API Key

### Option A: Using gcloud CLI
```bash
# Create API key
gcloud alpha services api-keys create \
    --display-name="German Buddy YouTube API" \
    --api-target=service=youtube.googleapis.com

# List your API keys to get the key string
gcloud alpha services api-keys list

# Get the actual key value
gcloud alpha services api-keys get-key-string KEY_ID
```

### Option B: Using Console
1. Go to: https://console.cloud.google.com
2. Select your project
3. Navigate to: APIs & Services → Credentials
4. Click: Create Credentials → API Key
5. Copy the generated key
6. (Optional) Restrict the key to YouTube Data API v3

## Step 3: Install Dependencies

```bash
# Navigate to scripts directory
cd scripts/

# Install Python dependencies
pip install -r requirements.txt

# Or install individually
pip install google-api-python-client pandas requests
```

## Step 4: Run the Clip Finder

```bash
# Set your API key (replace with your actual key)
export YOUTUBE_API_KEY="AIzaSyB..."

# Run the finder script
python youtube_clip_finder.py
```

The script will:
- Read your `collocations_extracted.csv` file
- Search YouTube for German clips containing each phrase
- Save results to `german_youtube_clips.json`
- Display progress and success rate

## Step 5: Integration Results

After running, you'll get a JSON file like:

```json
{
  "ich möchte": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "German Conversation: Ordering Food",
      "description": "Learn how to order food in German...",
      "thumbnail": "https://i.ytimg.com/vi/...",
      "channel": "Deutsch für Alle",
      "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
      "confidence": 15.5
    }
  ],
  "es gibt": [...]
}
```

## API Usage & Limits

**YouTube Data API v3 Quotas:**
- **Free tier**: 10,000 units/day
- **Search operation**: 100 units per request
- **Daily limit**: ~100 searches/day

**Optimization strategies:**
- Cache results locally (done automatically)
- Process in batches
- Focus on high-frequency phrases first
- Use smart search queries

## Search Strategy

The finder uses multiple search strategies:

1. `"phrase" German movie scene` - Exact phrase in movies
2. `"phrase" deutsche Filme Szene` - German movie scenes
3. `phrase German with subtitles` - Educational content
4. `"phrase" Deutsch lernen` - Learning materials
5. `phrase German dialogue` - Conversational content

## Confidence Scoring

Videos are scored based on:
- **Exact phrase in title**: +10 points
- **Phrase words in title**: +3 points per word
- **Words in description**: +1 point per word
- **German indicators**: +2 points per indicator
- **Educational channels**: +5 points

## Next Steps

1. **Run the finder** with your API key
2. **Review results** in `german_youtube_clips.json`
3. **Deploy JSON** to your PWA's public folder
4. **Update components** to use YouTube clips
5. **Test integration** with real phrases

## Troubleshooting

**"API key not found"**
```bash
echo $YOUTUBE_API_KEY  # Should show your key
```

**"Quota exceeded"**
- Wait until next day (quotas reset at midnight PST)
- Process fewer phrases at once
- Use cached results

**"No clips found"**
- Check if phrases are in German
- Try simpler/shorter phrases first
- Verify API key has YouTube access

## Example Usage

```bash
# Start with top 20 phrases (conserve quota)
python youtube_clip_finder.py --max-phrases 20

# Resume from cache (won't re-search cached phrases)
python youtube_clip_finder.py --max-phrases 100

# Check current cache status
python -c "import json; data=json.load(open('german_youtube_clips.json')); print(f'Cached: {len(data)} phrases')"
```

## Production Deployment

1. **Pre-generate clips** using this script
2. **Deploy JSON file** with your PWA
3. **No runtime API calls** needed
4. **Update monthly** to refresh content

This approach gives you authentic German video content while staying within free API limits!