#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Comprehensive German dictionary data based on A1 vocabulary from our stories
const dictionaryEntries = [
  // Family & People
  {
    german: "Familie",
    english: "family",
    pronunciation: "fa-MIL-ie",
    gender: "die",
    plural: "Familien",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Meine Familie ist groß.", english: "My family is big." },
      { german: "Wir sind eine glückliche Familie.", english: "We are a happy family." }
    ],
    categories: ["family", "people"],
    storyDays: [1, 8, 32, 41]
  },

  {
    german: "Mutter",
    english: "mother",
    pronunciation: "MUT-ter",
    gender: "die",
    plural: "Mütter",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Meine Mutter kocht gerne.", english: "My mother likes to cook." },
      { german: "Die Mutter ist sehr nett.", english: "The mother is very nice." }
    ],
    categories: ["family", "people"],
    storyDays: [1, 49]
  },

  {
    german: "Vater",
    english: "father",
    pronunciation: "FA-ter",
    gender: "der",
    plural: "Väter",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Mein Vater arbeitet im Büro.", english: "My father works in an office." },
      { german: "Der Vater liest die Zeitung.", english: "The father reads the newspaper." }
    ],
    categories: ["family", "people"],
    storyDays: [1, 64]
  },

  {
    german: "Kind",
    english: "child",
    pronunciation: "kint",
    gender: "das",
    plural: "Kinder",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Das Kind spielt im Garten.", english: "The child plays in the garden." },
      { german: "Alle Kinder sind glücklich.", english: "All children are happy." }
    ],
    categories: ["family", "people"],
    storyDays: [6, 11, 34]
  },

  // Daily routine & time
  {
    german: "aufstehen",
    english: "to get up, to stand up",
    pronunciation: "AUF-shte-hen",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "stehe auf",
      du: "stehst auf",
      er: "steht auf",
      wir: "stehen auf",
      ihr: "steht auf",
      sie: "stehen auf"
    },
    examples: [
      { german: "Ich stehe um sieben Uhr auf.", english: "I get up at seven o'clock." },
      { german: "Wann stehst du auf?", english: "When do you get up?" }
    ],
    categories: ["daily routine", "verbs"],
    storyDays: [2, 31]
  },

  {
    german: "schlafen",
    english: "to sleep",
    pronunciation: "SHLAH-fen",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "schlafe",
      du: "schläfst",
      er: "schläft",
      wir: "schlafen",
      ihr: "schlaft",
      sie: "schlafen"
    },
    examples: [
      { german: "Ich schlafe acht Stunden.", english: "I sleep eight hours." },
      { german: "Das Baby schläft tief.", english: "The baby sleeps deeply." }
    ],
    categories: ["daily routine", "verbs"],
    storyDays: [18, 19, 41]
  },

  // Food & eating
  {
    german: "essen",
    english: "to eat",
    pronunciation: "ES-sen",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "esse",
      du: "isst",
      er: "isst",
      wir: "essen",
      ihr: "esst",
      sie: "essen"
    },
    examples: [
      { german: "Ich esse gerne Äpfel.", english: "I like to eat apples." },
      { german: "Wir essen zusammen zu Abend.", english: "We eat dinner together." }
    ],
    categories: ["food", "verbs"],
    storyDays: [3, 10, 17]
  },

  {
    german: "Brot",
    english: "bread",
    pronunciation: "broht",
    gender: "das",
    plural: "Brote",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Das Brot ist frisch.", english: "The bread is fresh." },
      { german: "Ich esse Brot mit Butter.", english: "I eat bread with butter." }
    ],
    categories: ["food"],
    storyDays: [10, 26, 53]
  },

  // Colors
  {
    german: "blau",
    english: "blue",
    pronunciation: "blau",
    wordType: "adjective",
    level: "A1",
    examples: [
      { german: "Der Himmel ist blau.", english: "The sky is blue." },
      { german: "Ich trage ein blaues Kleid.", english: "I'm wearing a blue dress." }
    ],
    categories: ["colors", "adjectives"],
    storyDays: [4, 13, 16]
  },

  {
    german: "rot",
    english: "red",
    pronunciation: "roht",
    wordType: "adjective",
    level: "A1",
    examples: [
      { german: "Die Rose ist rot.", english: "The rose is red." },
      { german: "Ein rotes Auto fährt vorbei.", english: "A red car drives by." }
    ],
    categories: ["colors", "adjectives"],
    storyDays: [4, 15, 38]
  },

  // Animals
  {
    german: "Hund",
    english: "dog",
    pronunciation: "hunt",
    gender: "der",
    plural: "Hunde",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Der Hund ist sehr freundlich.", english: "The dog is very friendly." },
      { german: "Unser Hund heißt Bello.", english: "Our dog is called Bello." }
    ],
    categories: ["animals", "pets"],
    storyDays: [1, 19]
  },

  {
    german: "Katze",
    english: "cat",
    pronunciation: "KAT-se",
    gender: "die",
    plural: "Katzen",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Die Katze schläft gerne.", english: "The cat likes to sleep." },
      { german: "Eine schwarze Katze läuft vorbei.", english: "A black cat runs by." }
    ],
    categories: ["animals", "pets"],
    storyDays: [58]
  },

  // School & learning
  {
    german: "Schule",
    english: "school",
    pronunciation: "SHOO-le",
    gender: "die",
    plural: "Schulen",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Ich gehe gerne zur Schule.", english: "I like going to school." },
      { german: "Die Schule beginnt um acht Uhr.", english: "School starts at eight o'clock." }
    ],
    categories: ["school", "education"],
    storyDays: [2, 6, 11]
  },

  {
    german: "lernen",
    english: "to learn",
    pronunciation: "LER-nen",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "lerne",
      du: "lernst",
      er: "lernt",
      wir: "lernen",
      ihr: "lernt",
      sie: "lernen"
    },
    examples: [
      { german: "Ich lerne Deutsch.", english: "I'm learning German." },
      { german: "Kinder lernen schnell.", english: "Children learn quickly." }
    ],
    categories: ["school", "verbs"],
    storyDays: [6, 11, 25, 60]
  },

  // House & home
  {
    german: "Haus",
    english: "house",
    pronunciation: "haus",
    gender: "das",
    plural: "Häuser",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Wir wohnen in einem großen Haus.", english: "We live in a big house." },
      { german: "Das Haus hat einen schönen Garten.", english: "The house has a beautiful garden." }
    ],
    categories: ["house", "home"],
    storyDays: [8, 9, 16]
  },

  {
    german: "Zimmer",
    english: "room",
    pronunciation: "TSIM-mer",
    gender: "das",
    plural: "Zimmer",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Mein Zimmer ist klein aber gemütlich.", english: "My room is small but cozy." },
      { german: "Das Zimmer hat zwei Fenster.", english: "The room has two windows." }
    ],
    categories: ["house", "home"],
    storyDays: [4, 9, 23]
  },

  // Weather & seasons
  {
    german: "Wetter",
    english: "weather",
    pronunciation: "VET-ter",
    gender: "das",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Das Wetter ist heute schön.", english: "The weather is nice today." },
      { german: "Wie ist das Wetter?", english: "How is the weather?" }
    ],
    categories: ["weather", "nature"],
    storyDays: [7, 16, 43]
  },

  {
    german: "Sonne",
    english: "sun",
    pronunciation: "ZON-ne",
    gender: "die",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Die Sonne scheint hell.", english: "The sun shines brightly." },
      { german: "Ich liebe die warme Sonne.", english: "I love the warm sun." }
    ],
    categories: ["weather", "nature"],
    storyDays: [7, 44, 74]
  },

  // Basic verbs
  {
    german: "sein",
    english: "to be",
    pronunciation: "zine",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "bin",
      du: "bist",
      er: "ist",
      wir: "sind",
      ihr: "seid",
      sie: "sind"
    },
    examples: [
      { german: "Ich bin neun Jahre alt.", english: "I am nine years old." },
      { german: "Das ist meine Familie.", english: "This is my family." }
    ],
    categories: ["verbs", "basic"],
    storyDays: [1, 2, 3, 4, 5]
  },

  {
    german: "haben",
    english: "to have",
    pronunciation: "HAH-ben",
    wordType: "verb",
    level: "A1",
    conjugation: {
      ich: "habe",
      du: "hast",
      er: "hat",
      wir: "haben",
      ihr: "habt",
      sie: "haben"
    },
    examples: [
      { german: "Ich habe einen Bruder.", english: "I have a brother." },
      { german: "Wir haben einen Hund.", english: "We have a dog." }
    ],
    categories: ["verbs", "basic"],
    storyDays: [1, 2, 4, 13]
  },

  // Numbers & time
  {
    german: "eins",
    english: "one",
    pronunciation: "ines",
    wordType: "number",
    level: "A1",
    examples: [
      { german: "Ich habe eins, zwei, drei Äpfel.", english: "I have one, two, three apples." },
      { german: "Es ist ein Uhr.", english: "It's one o'clock." }
    ],
    categories: ["numbers"],
    storyDays: [11, 12]
  },

  {
    german: "Zeit",
    english: "time",
    pronunciation: "tsite",
    gender: "die",
    wordType: "noun",
    level: "A1",
    examples: [
      { german: "Ich habe keine Zeit.", english: "I don't have time." },
      { german: "Die Zeit vergeht schnell.", english: "Time passes quickly." }
    ],
    categories: ["time"],
    storyDays: [12]
  },

  // Feelings & emotions
  {
    german: "glücklich",
    english: "happy",
    pronunciation: "GLÜK-likh",
    wordType: "adjective",
    level: "A1",
    examples: [
      { german: "Ich bin sehr glücklich.", english: "I am very happy." },
      { german: "Die glückliche Familie lacht.", english: "The happy family laughs." }
    ],
    categories: ["emotions", "adjectives"],
    storyDays: [1, 23, 32]
  },

  {
    german: "traurig",
    english: "sad",
    pronunciation: "TROU-rikh",
    wordType: "adjective",
    level: "A1",
    examples: [
      { german: "Warum bist du traurig?", english: "Why are you sad?" },
      { german: "Der traurige Junge weint.", english: "The sad boy cries." }
    ],
    categories: ["emotions", "adjectives"],
    storyDays: [33, 37, 39]
  }
];

// Create comprehensive dictionary database
const createDictionaryDatabase = () => {
  // Add additional metadata and search optimization
  return dictionaryEntries.map((entry, index) => ({
    id: index + 1,
    ...entry,
    searchTerms: [
      entry.german.toLowerCase(),
      entry.english.toLowerCase(),
      ...(entry.categories || []),
      ...(entry.examples?.map(ex => ex.german.toLowerCase()) || []),
      ...(entry.examples?.map(ex => ex.english.toLowerCase()) || [])
    ],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }));
};

// Generate dictionary statistics
const generateDictionaryStats = (dictionary) => {
  return {
    totalEntries: dictionary.length,
    byWordType: {
      noun: dictionary.filter(d => d.wordType === 'noun').length,
      verb: dictionary.filter(d => d.wordType === 'verb').length,
      adjective: dictionary.filter(d => d.wordType === 'adjective').length,
      number: dictionary.filter(d => d.wordType === 'number').length,
      other: dictionary.filter(d => !['noun', 'verb', 'adjective', 'number'].includes(d.wordType)).length
    },
    byLevel: {
      A1: dictionary.filter(d => d.level === 'A1').length,
      A2: dictionary.filter(d => d.level === 'A2').length,
      B1: dictionary.filter(d => d.level === 'B1').length,
      B2: dictionary.filter(d => d.level === 'B2').length,
      C1: dictionary.filter(d => d.level === 'C1').length,
      C2: dictionary.filter(d => d.level === 'C2').length
    },
    categories: [...new Set(dictionary.flatMap(d => d.categories || []))],
    lastUpdated: new Date().toISOString()
  };
};

// Main function to create dictionary data
async function createDictionaryData() {
  console.log('📚 Creating German dictionary database...');

  const dictionary = createDictionaryDatabase();
  const stats = generateDictionaryStats(dictionary);

  // Create data directory
  const dataDir = path.join(process.cwd(), 'public', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  // Save dictionary data
  const dictionaryPath = path.join(dataDir, 'german_dictionary.json');
  await fs.writeFile(dictionaryPath, JSON.stringify(dictionary, null, 2));

  // Save dictionary statistics
  const statsPath = path.join(dataDir, 'dictionary_stats.json');
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));

  console.log(`✅ Created dictionary with ${dictionary.length} entries`);
  console.log(`📊 Word types: ${stats.byWordType.noun} nouns, ${stats.byWordType.verb} verbs, ${stats.byWordType.adjective} adjectives`);
  console.log(`🎯 Level A1: ${stats.byLevel.A1} entries`);
  console.log(`📁 Saved to: ${dictionaryPath}`);
  console.log(`📈 Stats saved to: ${statsPath}`);

  return { dictionary, stats };
}

// Main execution
async function main() {
  try {
    await createDictionaryData();
    console.log('🎉 Dictionary creation complete!');
    console.log('🔍 Ready for integration into German Buddy app!');
  } catch (error) {
    console.error('❌ Error creating dictionary:', error);
    process.exit(1);
  }
}

main();