#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Curated German stories with careful progression
const curatedStories = [
  // A1 Level - Days 1-80 (Foundation)

  // Week 1: Family & Personal Introduction
  {
    day: 1,
    level: "A1",
    topic: "Familie",
    title: "Ich bin Lisa",
    text: "Hallo! Ich heiße Lisa und bin neun Jahre alt. Ich wohne in München mit meiner Familie. Mein Papa heißt Thomas und arbeitet in einem Büro. Meine Mama heißt Anna und ist Lehrerin. Ich habe einen kleinen Bruder, er heißt Tim und ist sechs Jahre alt. Wir haben auch einen Hund. Er heißt Bello und ist sehr freundlich. Unsere Familie ist glücklich.",
    vocabulary: ["Familie", "heiße", "wohne", "arbeitet", "freundlich"],
    grammar_focus: "Present tense of sein and haben, personal pronouns",
    cultural_note: "German families often live in apartments in cities like Munich. Children typically introduce themselves with their age.",
    comprehension_questions: [
      {
        question: "Wie alt ist Lisa?",
        type: "multiple_choice",
        options: ["acht Jahre", "neun Jahre", "zehn Jahre", "sechs Jahre"],
        correct: 1,
        explanation: "Lisa sagt: 'Ich bin neun Jahre alt.'"
      }
    ]
  },

  {
    day: 2,
    level: "A1",
    topic: "Tagesablauf",
    title: "Mein Morgen",
    text: "Ich stehe jeden Tag um sieben Uhr auf. Zuerst gehe ich ins Badezimmer und putze meine Zähne. Dann wasche ich mein Gesicht mit kaltem Wasser. In der Küche trinke ich ein Glas Milch und esse ein Butterbrot. Mama macht mir ein Pausenbrot für die Schule. Um acht Uhr gehe ich zur Schule. Der Schulweg dauert zehn Minuten.",
    vocabulary: ["aufstehen", "Badezimmer", "putzen", "Pausenbrot", "Schulweg"],
    grammar_focus: "Time expressions with um, daily routine verbs",
    cultural_note: "German children often walk to school independently, and 'Pausenbrot' (school sandwich) is a daily tradition.",
    comprehension_questions: [
      {
        question: "Wann steht Lisa auf?",
        type: "multiple_choice",
        options: ["um sechs Uhr", "um sieben Uhr", "um acht Uhr", "um neun Uhr"],
        correct: 1,
        explanation: "Der Text sagt: 'Ich stehe jeden Tag um sieben Uhr auf.'"
      }
    ]
  },

  {
    day: 3,
    level: "A1",
    topic: "Essen",
    title: "Das Mittagessen",
    text: "Heute koche ich mit Oma. Wir machen Spaghetti mit Tomatensoße. Oma schneidet Zwiebeln und ich rühre in der Pfanne. Die Tomaten sind rot und süß. Wir geben auch Salz und Pfeffer dazu. Nach zwanzig Minuten ist das Essen fertig. Es riecht sehr gut! Papa und Tim kommen zum Essen. Alle sagen: 'Das schmeckt lecker!'",
    vocabulary: ["kochen", "schneiden", "rühren", "fertig", "lecker"],
    grammar_focus: "Action verbs in present tense, descriptive adjectives",
    cultural_note: "Cooking with grandparents is common in German families, and midday meals are important family time.",
    comprehension_questions: [
      {
        question: "Was kochen Lisa und Oma?",
        type: "multiple_choice",
        options: ["Suppe", "Spaghetti", "Salat", "Brot"],
        correct: 1,
        explanation: "Sie machen 'Spaghetti mit Tomatensoße'."
      }
    ]
  },

  {
    day: 4,
    level: "A1",
    topic: "Farben",
    title: "Meine Lieblingsfarbe",
    text: "Meine Lieblingsfarbe ist blau wie der Himmel. Mein Zimmer hat blaue Wände und ein weißes Bett. Der Teppich ist grau und weich. Auf dem Schreibtisch steht eine gelbe Lampe. Meine Schultasche ist rot und schwarz. Im Kleiderschrank hängen bunte Kleider: grüne, rosa und orange. Ich trage gern das blaue Kleid mit weißen Schuhen.",
    vocabulary: ["Lieblingsfarbe", "Himmel", "Teppich", "Kleiderschrank", "tragen"],
    grammar_focus: "Color adjectives, adjective endings with articles",
    cultural_note: "German children often have their own decorated rooms and take pride in choosing their favorite colors.",
    comprehension_questions: [
      {
        question: "Welche Farbe hat Lisas Lampe?",
        type: "multiple_choice",
        options: ["blau", "weiß", "gelb", "rot"],
        correct: 2,
        explanation: "Der Text sagt: 'eine gelbe Lampe'."
      }
    ]
  },

  {
    day: 5,
    level: "A1",
    topic: "Tiere",
    title: "Im Zoo",
    text: "Heute besuchen wir den Zoo. Zuerst sehen wir die großen Elefanten. Sie sind grau und haben lange Rüssel. Die kleinen Affen springen von Ast zu Ast. Sie sind lustig und schnell. Im Wasser schwimmen bunte Fische. Die Löwen schlafen in der Sonne. Zum Schluss füttern wir die Ziegen mit Karotten. Tim hat keine Angst vor den Tieren.",
    vocabulary: ["besuchen", "Elefanten", "springen", "schwimmen", "füttern"],
    grammar_focus: "Animal names, descriptive verbs, present tense",
    cultural_note: "German zoos often allow children to feed certain animals and emphasize animal education.",
    comprehension_questions: [
      {
        question: "Womit füttern Lisa und Tim die Ziegen?",
        type: "multiple_choice",
        options: ["Äpfeln", "Brot", "Karotten", "Bananen"],
        correct: 2,
        explanation: "Sie füttern die Ziegen 'mit Karotten'."
      }
    ]
  },

  // Week 2: School and Friends
  {
    day: 6,
    level: "A1",
    topic: "Schule",
    title: "Meine Klasse",
    text: "Meine Klasse ist groß und hell. Wir sind zwanzig Kinder: elf Mädchen und neun Jungen. Unsere Lehrerin heißt Frau Weber. Sie ist nett und hilft uns beim Lernen. Mein Platz ist am Fenster. Neben mir sitzt meine Freundin Emma. Wir lernen zusammen Deutsch, Mathematik und Sachkunde. In der Pause spielen wir auf dem Schulhof.",
    vocabulary: ["Klasse", "Mädchen", "Lehrerin", "Platz", "Schulhof"],
    grammar_focus: "Numbers, classroom vocabulary, present tense",
    cultural_note: "German elementary classes typically have 20-25 students and emphasize collaborative learning.",
    comprehension_questions: [
      {
        question: "Wie viele Kinder sind in Lisas Klasse?",
        type: "multiple_choice",
        options: ["neunzehn", "zwanzig", "einundzwanzig", "achtzehn"],
        correct: 1,
        explanation: "Der Text sagt: 'Wir sind zwanzig Kinder'."
      }
    ]
  },

  {
    day: 7,
    level: "A1",
    topic: "Wetter",
    title: "Regen und Sonne",
    text: "Das Wetter in Deutschland ändert sich oft. Heute regnet es. Ich trage meinen roten Regenmantel und gelbe Gummistiefel. Mit dem Regenschirm bleibe ich trocken. Gestern schien die Sonne und es war warm. Wir spielten im Garten. Morgen soll es schneien! Dann bauen wir einen Schneemann. Jede Jahreszeit ist schön auf ihre Art.",
    vocabulary: ["Wetter", "Regenmantel", "Gummistiefel", "Regenschirm", "Schneemann"],
    grammar_focus: "Weather vocabulary, past and future expressions",
    cultural_note: "German weather changes frequently, and children learn to dress appropriately for different conditions.",
    comprehension_questions: [
      {
        question: "Welche Farbe haben Lisas Gummistiefel?",
        type: "multiple_choice",
        options: ["rot", "gelb", "blau", "grün"],
        correct: 1,
        explanation: "Sie trägt 'gelbe Gummistiefel'."
      }
    ]
  }
];

// Enhanced story structure
const createStoryDatabase = () => {
  return curatedStories.map(story => ({
    ...story,
    date: `Day ${story.day}`,
    targetWordCount: story.text.split(' ').length,
    id: story.day,
    completed: false,
    source: "curated",
    created_at: new Date().toISOString(),
    quality_score: 5.0 // All curated stories get max quality
  }));
};

// Generate enhanced stories
async function generateCuratedStories() {
  console.log('📚 Creating curated German story collection...');

  const stories = createStoryDatabase();

  // Create data directory
  const dataDir = path.join(process.cwd(), 'public', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  // Save main story collection
  const mainPath = path.join(dataDir, 'german_stories_curated.json');
  await fs.writeFile(mainPath, JSON.stringify(stories, null, 2));

  // Create index for easy navigation
  const index = {
    totalStories: stories.length,
    levels: {
      A1: stories.filter(s => s.level === 'A1').length,
      A2: stories.filter(s => s.level === 'A2').length,
      B1: stories.filter(s => s.level === 'B1').length,
      B2: stories.filter(s => s.level === 'B2').length,
      C1: stories.filter(s => s.level === 'C1').length,
      C2: stories.filter(s => s.level === 'C2').length
    },
    topics: [...new Set(stories.map(s => s.topic))],
    averageWordCount: Math.round(stories.reduce((sum, s) => sum + s.targetWordCount, 0) / stories.length),
    qualityScore: 5.0,
    lastUpdated: new Date().toISOString()
  };

  const indexPath = path.join(dataDir, 'stories_index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

  // Update sample stories to use curated content
  const samplePath = path.join(dataDir, 'sample_stories.json');
  await fs.writeFile(samplePath, JSON.stringify(stories.slice(0, 5), null, 2));

  console.log(`✅ Created ${stories.length} curated German stories`);
  console.log(`📁 Saved to: ${mainPath}`);
  console.log(`📊 Index saved to: ${indexPath}`);
  console.log(`🎯 Average word count: ${index.averageWordCount} words`);
  console.log(`🏆 Quality score: ${index.qualityScore}/5.0`);

  return stories;
}

// Main execution
async function main() {
  try {
    await generateCuratedStories();
    console.log('🎉 Curated story creation complete!');
  } catch (error) {
    console.error('❌ Error creating curated stories:', error);
    process.exit(1);
  }
}

main();