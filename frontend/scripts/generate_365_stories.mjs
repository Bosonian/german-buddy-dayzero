#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// CEFR level distribution across 365 days
// A1: Days 1-60 (2 months)
// A2: Days 61-120 (2 months)
// B1: Days 121-210 (3 months)
// B2: Days 211-300 (3 months)
// C1: Days 301-345 (1.5 months)
// C2: Days 346-365 (0.5 months)

const LEVEL_RANGES = {
  A1: { start: 1, end: 60, wordCount: 50 },
  A2: { start: 61, end: 120, wordCount: 80 },
  B1: { start: 121, end: 210, wordCount: 120 },
  B2: { start: 211, end: 300, wordCount: 180 },
  C1: { start: 301, end: 345, wordCount: 250 },
  C2: { start: 346, end: 365, wordCount: 300 }
};

// Topics that progress in complexity
const TOPICS = {
  A1: [
    'Familie', 'Essen', 'Zahlen', 'Farben', 'Wetter', 'Zeit', 'Haus', 'Schule',
    'Tiere', 'Kleidung', 'Körper', 'Hobbys', 'Einkaufen', 'Transport', 'Tagesablauf'
  ],
  A2: [
    'Reisen', 'Arbeit', 'Gesundheit', 'Freizeit', 'Feste', 'Sport', 'Medien',
    'Restaurant', 'Wohnung', 'Stadt', 'Natur', 'Freundschaft', 'Urlaub', 'Verkehr'
  ],
  B1: [
    'Bildung', 'Beruf', 'Kultur', 'Umwelt', 'Technologie', 'Geschichte', 'Kunst',
    'Wissenschaft', 'Politik', 'Wirtschaft', 'Gesellschaft', 'Zukunft', 'Träume'
  ],
  B2: [
    'Globalisierung', 'Klimawandel', 'Digitalisierung', 'Integration', 'Innovation',
    'Nachhaltigkeit', 'Demokratie', 'Gerechtigkeit', 'Philosophie', 'Psychologie'
  ],
  C1: [
    'Ethik', 'Forschung', 'Literatur', 'Ökonomie', 'Soziologie', 'Anthropologie',
    'Neurologie', 'Quantenphysik', 'Künstliche Intelligenz', 'Genetik'
  ],
  C2: [
    'Metaphysik', 'Epistemologie', 'Postmoderne', 'Dekonstruktion', 'Transhumanismus',
    'Kosmologie', 'Bewusstseinsforschung', 'Systemtheorie'
  ]
};

function getLevel(day) {
  for (const [level, range] of Object.entries(LEVEL_RANGES)) {
    if (day >= range.start && day <= range.end) {
      return level;
    }
  }
  return 'B1';
}

function getTopic(level, day) {
  const topics = TOPICS[level] || TOPICS.B1;
  return topics[day % topics.length];
}

// Generate story using Ollama
async function generateStoryWithOllama(day, level, topic, wordCount) {
  const prompt = `Generate a German story for day ${day} of 365.
Level: ${level}
Topic: ${topic}
Word count: approximately ${wordCount} words

Requirements:
1. Story must be exactly at ${level} level difficulty
2. Use vocabulary and grammar appropriate for ${level}
3. Make it engaging and educational
4. Include cultural elements when possible
5. The story should be complete and self-contained

Respond with ONLY a JSON object in this exact format:
{
  "title": "German title here",
  "text": "Complete German story text here",
  "vocabulary": ["word1", "word2", "word3", "word4", "word5"],
  "grammar_focus": "Main grammar point illustrated",
  "cultural_note": "Brief cultural element if any"
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
          top_p: 0.9,
          seed: day // Use day as seed for consistency
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.response.trim();

    // Clean up response
    responseText = responseText.replace(/^[^{]*{/, '{');
    responseText = responseText.replace(/}[^}]*$/, '}');

    return JSON.parse(responseText);
  } catch (error) {
    console.error(`Error generating story for day ${day}:`, error);
    // Return fallback story
    return generateFallbackStory(day, level, topic, wordCount);
  }
}

// Fallback story generator
function generateFallbackStory(day, level, topic, wordCount) {
  const templates = {
    A1: {
      title: `${topic} - Tag ${day}`,
      text: `Heute lernen wir über ${topic}. Das ist sehr interessant. Ich mag ${topic}. Es ist wichtig für uns. Wir üben jeden Tag. Das macht Spaß. Morgen lernen wir mehr.`,
      vocabulary: ['heute', 'lernen', 'wichtig', 'üben', 'morgen'],
      grammar_focus: 'Präsens',
      cultural_note: 'Deutsche Kultur ist vielfältig.'
    },
    A2: {
      title: `Eine Geschichte über ${topic}`,
      text: `Gestern war ich in der Stadt. Ich habe viel über ${topic} gelernt. Es war ein schöner Tag. Ich habe neue Freunde getroffen. Wir haben zusammen gesprochen. Nächste Woche gehe ich wieder dorthin.`,
      vocabulary: ['gestern', 'gelernt', 'getroffen', 'zusammen', 'nächste'],
      grammar_focus: 'Perfekt',
      cultural_note: 'In Deutschland ist Pünktlichkeit wichtig.'
    },
    B1: {
      title: `Gedanken über ${topic}`,
      text: `${topic} ist ein wichtiges Thema in unserer Gesellschaft. Viele Menschen beschäftigen sich damit. Es gibt verschiedene Meinungen dazu. Manche finden es gut, andere sind kritisch. Wir sollten darüber diskutieren.`,
      vocabulary: ['Gesellschaft', 'beschäftigen', 'Meinungen', 'kritisch', 'diskutieren'],
      grammar_focus: 'Modalverben',
      cultural_note: 'Deutsche diskutieren gerne über wichtige Themen.'
    },
    B2: {
      title: `Analyse von ${topic}`,
      text: `Die Bedeutung von ${topic} hat sich in den letzten Jahren erheblich verändert. Wissenschaftler untersuchen die Auswirkungen auf unsere Gesellschaft. Die Ergebnisse sind überraschend.`,
      vocabulary: ['Bedeutung', 'erheblich', 'untersuchen', 'Auswirkungen', 'überraschend'],
      grammar_focus: 'Passiv',
      cultural_note: 'Deutschland ist bekannt für gründliche Forschung.'
    },
    C1: {
      title: `Kritische Betrachtung: ${topic}`,
      text: `Die komplexen Zusammenhänge von ${topic} erfordern eine differenzierte Betrachtungsweise. Interdisziplinäre Ansätze bieten neue Perspektiven.`,
      vocabulary: ['Zusammenhänge', 'differenziert', 'interdisziplinär', 'Perspektiven', 'erfordern'],
      grammar_focus: 'Nominalisierung',
      cultural_note: 'Akademischer Diskurs ist in Deutschland hochgeschätzt.'
    },
    C2: {
      title: `Philosophische Reflexion über ${topic}`,
      text: `Die epistemologischen Implikationen von ${topic} werfen fundamentale Fragen auf. Die Diskursanalyse offenbart verborgene Machtstrukturen.`,
      vocabulary: ['epistemologisch', 'Implikationen', 'fundamental', 'Diskursanalyse', 'Machtstrukturen'],
      grammar_focus: 'Wissenschaftssprache',
      cultural_note: 'Deutsche Philosophie hat weltweiten Einfluss.'
    }
  };

  return templates[level] || templates.B1;
}

async function generateAllStories() {
  const stories = [];
  const batchSize = 10; // Process in batches to avoid overwhelming Ollama

  console.log('🚀 Starting generation of 365 German stories...');

  for (let day = 1; day <= 365; day++) {
    const level = getLevel(day);
    const topic = getTopic(level, day);
    const wordCount = LEVEL_RANGES[level].wordCount;

    console.log(`📝 Generating story ${day}/365 - Level: ${level}, Topic: ${topic}`);

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

    // Save progress every 10 stories
    if (day % batchSize === 0) {
      await saveProgress(stories);
      console.log(`💾 Saved progress: ${day}/365 stories`);

      // Small delay to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final save
  await saveProgress(stories);
  console.log('✅ Successfully generated all 365 stories!');

  // Create index file for easy access
  await createIndex(stories);
  console.log('📚 Created story index');

  return stories;
}

async function saveProgress(stories) {
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'german_stories_365.json');
  await fs.writeFile(filePath, JSON.stringify(stories, null, 2));
}

async function createIndex(stories) {
  const dataDir = path.join(process.cwd(), 'data');

  // Create level-based indexes
  const byLevel = {};
  for (const story of stories) {
    if (!byLevel[story.level]) {
      byLevel[story.level] = [];
    }
    byLevel[story.level].push({
      day: story.day,
      title: story.title,
      topic: story.topic
    });
  }

  const indexPath = path.join(dataDir, 'stories_index.json');
  await fs.writeFile(indexPath, JSON.stringify({
    totalStories: stories.length,
    levels: Object.keys(byLevel).map(level => ({
      level,
      count: byLevel[level].length,
      range: `Days ${LEVEL_RANGES[level].start}-${LEVEL_RANGES[level].end}`
    })),
    byLevel
  }, null, 2));
}

// Main execution
async function main() {
  try {
    // Check if Ollama is running
    const testResponse = await fetch('http://localhost:11434/api/tags');
    if (!testResponse.ok) {
      console.error('❌ Ollama is not running. Please start Ollama first.');
      process.exit(1);
    }

    await generateAllStories();
    console.log('🎉 Story generation complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();