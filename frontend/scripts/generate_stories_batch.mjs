#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Generate first 30 stories for testing
const BATCH_SIZE = 30;

const LEVEL_RANGES = {
  A1: { start: 1, end: 60, wordCount: 50 },
  A2: { start: 61, end: 120, wordCount: 80 },
  B1: { start: 121, end: 210, wordCount: 120 },
  B2: { start: 211, end: 300, wordCount: 180 },
  C1: { start: 301, end: 345, wordCount: 250 },
  C2: { start: 346, end: 365, wordCount: 300 }
};

const TOPICS = {
  A1: [
    'Familie', 'Essen', 'Zahlen', 'Farben', 'Wetter', 'Zeit', 'Haus', 'Schule',
    'Tiere', 'Kleidung', 'Körper', 'Hobbys', 'Einkaufen', 'Transport', 'Tagesablauf'
  ]
};

function getLevel(day) {
  for (const [level, range] of Object.entries(LEVEL_RANGES)) {
    if (day >= range.start && day <= range.end) {
      return level;
    }
  }
  return 'A1';
}

function getTopic(level, day) {
  const topics = TOPICS[level] || TOPICS.A1;
  return topics[(day - 1) % topics.length];
}

async function generateStoryWithOllama(day, level, topic, wordCount) {
  const prompt = `Create a simple German story for beginners.
Level: ${level}
Topic: ${topic}
Length: About ${wordCount} words

Write a simple, complete story in German. Make it interesting and educational.
After the story, provide 5 key vocabulary words and one grammar point.

Format your response as JSON:
{
  "title": "Story title in German",
  "text": "Complete story in German",
  "vocabulary": ["word1", "word2", "word3", "word4", "word5"],
  "grammar_focus": "Main grammar point",
  "cultural_note": "Brief cultural fact"
}`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.response.trim();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.log('Parse error, using fallback');
      return generateFallbackStory(day, level, topic);
    }
  } catch (error) {
    console.error(`Error generating story for day ${day}:`, error);
    return generateFallbackStory(day, level, topic);
  }
}

function generateFallbackStory(day, level, topic) {
  const stories = {
    'Familie': {
      title: "Meine Familie",
      text: "Ich habe eine kleine Familie. Mein Vater heißt Hans. Meine Mutter heißt Anna. Ich habe einen Bruder. Er heißt Max. Wir wohnen in Berlin. Unsere Familie ist glücklich. Am Wochenende essen wir zusammen. Das ist schön.",
      vocabulary: ["Familie", "Vater", "Mutter", "Bruder", "wohnen"],
      grammar_focus: "Possessive pronouns (mein, meine)",
      cultural_note: "German families often eat together on weekends."
    },
    'Essen': {
      title: "Das Frühstück",
      text: "Morgens esse ich Brot mit Butter. Ich trinke Kaffee oder Tee. Mein Bruder isst Müsli. Er trinkt Milch. Zum Frühstück gibt es auch Eier. In Deutschland isst man oft Brot zum Frühstück. Das schmeckt gut.",
      vocabulary: ["Frühstück", "Brot", "trinken", "essen", "schmecken"],
      grammar_focus: "Present tense of essen and trinken",
      cultural_note: "Bread is a staple of German breakfast."
    },
    'Schule': {
      title: "In der Schule",
      text: "Ich gehe jeden Tag zur Schule. Die Schule beginnt um acht Uhr. Ich lerne Deutsch, Mathematik und Englisch. Meine Lehrerin ist nett. In der Pause spiele ich mit Freunden. Nach der Schule mache ich Hausaufgaben.",
      vocabulary: ["Schule", "lernen", "Lehrerin", "Pause", "Hausaufgaben"],
      grammar_focus: "Time expressions (um acht Uhr)",
      cultural_note: "German schools typically start at 8 AM."
    }
  };

  return stories[topic] || stories['Familie'];
}

async function generateBatch() {
  const stories = [];

  console.log(`🚀 Generating first ${BATCH_SIZE} German stories...`);

  for (let day = 1; day <= BATCH_SIZE; day++) {
    const level = getLevel(day);
    const topic = getTopic(level, day);
    const wordCount = LEVEL_RANGES[level].wordCount;

    console.log(`📝 Story ${day}/${BATCH_SIZE} - ${topic} (${level})`);

    const story = await generateStoryWithOllama(day, level, topic, wordCount);

    stories.push({
      day,
      date: `Day ${day}`,
      level,
      topic,
      targetWordCount: wordCount,
      ...story,
      id: day,
      completed: false
    });

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save stories
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'german_stories_batch.json');
  await fs.writeFile(filePath, JSON.stringify(stories, null, 2));

  console.log(`✅ Generated ${BATCH_SIZE} stories!`);
  console.log(`📁 Saved to: ${filePath}`);

  return stories;
}

// Main execution
async function main() {
  try {
    await generateBatch();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();