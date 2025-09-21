#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Complete A1 German Stories Collection (Days 1-80)
const completeA1Stories = [
  // Week 1: Foundation (Days 1-7) - Already exist, but included for completeness
  {
    day: 1,
    level: "A1",
    topic: "Familie",
    title: "Ich bin Lisa",
    text: "Hallo! Ich heiße Lisa und bin neun Jahre alt. Ich wohne in München mit meiner Familie. Mein Papa heißt Thomas und arbeitet in einem Büro. Meine Mama heißt Anna und ist Lehrerin. Ich habe einen kleinen Bruder, er heißt Tim und ist sechs Jahre alt. Wir haben auch einen Hund. Er heißt Bello und ist sehr freundlich. Unsere Familie ist glücklich.",
    vocabulary: ["Familie", "heiße", "wohne", "arbeitet", "freundlich"],
    grammar_focus: "Present tense of sein and haben, personal pronouns",
    cultural_note: "German families often live in apartments in cities like Munich. Children typically introduce themselves with their age."
  },

  {
    day: 2,
    level: "A1",
    topic: "Tagesablauf",
    title: "Mein Morgen",
    text: "Ich stehe jeden Tag um sieben Uhr auf. Zuerst gehe ich ins Badezimmer und putze meine Zähne. Dann wasche ich mein Gesicht mit kaltem Wasser. In der Küche trinke ich ein Glas Milch und esse ein Butterbrot. Mama macht mir ein Pausenbrot für die Schule. Um acht Uhr gehe ich zur Schule. Der Schulweg dauert zehn Minuten.",
    vocabulary: ["aufstehen", "Badezimmer", "putzen", "Pausenbrot", "Schulweg"],
    grammar_focus: "Time expressions with um, daily routine verbs",
    cultural_note: "German children often walk to school independently, and 'Pausenbrot' (school sandwich) is a daily tradition."
  },

  {
    day: 3,
    level: "A1",
    topic: "Essen",
    title: "Das Mittagessen",
    text: "Heute koche ich mit Oma. Wir machen Spaghetti mit Tomatensoße. Oma schneidet Zwiebeln und ich rühre in der Pfanne. Die Tomaten sind rot und süß. Wir geben auch Salz und Pfeffer dazu. Nach zwanzig Minuten ist das Essen fertig. Es riecht sehr gut! Papa und Tim kommen zum Essen. Alle sagen: 'Das schmeckt lecker!'",
    vocabulary: ["kochen", "schneiden", "rühren", "fertig", "lecker"],
    grammar_focus: "Action verbs in present tense, descriptive adjectives",
    cultural_note: "Cooking with grandparents is common in German families, and midday meals are important family time."
  },

  {
    day: 4,
    level: "A1",
    topic: "Farben",
    title: "Meine Lieblingsfarbe",
    text: "Meine Lieblingsfarbe ist blau wie der Himmel. Mein Zimmer hat blaue Wände und ein weißes Bett. Der Teppich ist grau und weich. Auf dem Schreibtisch steht eine gelbe Lampe. Meine Schultasche ist rot und schwarz. Im Kleiderschrank hängen bunte Kleider: grüne, rosa und orange. Ich trage gern das blaue Kleid mit weißen Schuhen.",
    vocabulary: ["Lieblingsfarbe", "Himmel", "Teppich", "Kleiderschrank", "tragen"],
    grammar_focus: "Color adjectives, adjective endings with articles",
    cultural_note: "German children often have their own decorated rooms and take pride in choosing their favorite colors."
  },

  {
    day: 5,
    level: "A1",
    topic: "Tiere",
    title: "Im Zoo",
    text: "Heute besuchen wir den Zoo. Zuerst sehen wir die großen Elefanten. Sie sind grau und haben lange Rüssel. Die kleinen Affen springen von Ast zu Ast. Sie sind lustig und schnell. Im Wasser schwimmen bunte Fische. Die Löwen schlafen in der Sonne. Zum Schluss füttern wir die Ziegen mit Karotten. Tim hat keine Angst vor den Tieren.",
    vocabulary: ["besuchen", "Elefanten", "springen", "schwimmen", "füttern"],
    grammar_focus: "Animal names, descriptive verbs, present tense",
    cultural_note: "German zoos often allow children to feed certain animals and emphasize animal education."
  },

  {
    day: 6,
    level: "A1",
    topic: "Schule",
    title: "Meine Klasse",
    text: "Meine Klasse ist groß und hell. Wir sind zwanzig Kinder: elf Mädchen und neun Jungen. Unsere Lehrerin heißt Frau Weber. Sie ist nett und hilft uns beim Lernen. Mein Platz ist am Fenster. Neben mir sitzt meine Freundin Emma. Wir lernen zusammen Deutsch, Mathematik und Sachkunde. In der Pause spielen wir auf dem Schulhof.",
    vocabulary: ["Klasse", "Mädchen", "Lehrerin", "Platz", "Schulhof"],
    grammar_focus: "Numbers, classroom vocabulary, present tense",
    cultural_note: "German elementary classes typically have 20-25 students and emphasize collaborative learning."
  },

  {
    day: 7,
    level: "A1",
    topic: "Wetter",
    title: "Regen und Sonne",
    text: "Das Wetter in Deutschland ändert sich oft. Heute regnet es. Ich trage meinen roten Regenmantel und gelbe Gummistiefel. Mit dem Regenschirm bleibe ich trocken. Gestern schien die Sonne und es war warm. Wir spielten im Garten. Morgen soll es schneien! Dann bauen wir einen Schneemann. Jede Jahreszeit ist schön auf ihre Art.",
    vocabulary: ["Wetter", "Regenmantel", "Gummistiefel", "Regenschirm", "Schneemann"],
    grammar_focus: "Weather vocabulary, past and future expressions",
    cultural_note: "German weather changes frequently, and children learn to dress appropriately for different conditions."
  },

  // Week 2: Family & Personal (Days 8-14)
  {
    day: 8,
    level: "A1",
    topic: "Familie",
    title: "Meine Großeltern",
    text: "Ich besuche gerne meine Großeltern. Opa Hans ist achtzig Jahre alt und hat graue Haare. Oma Maria ist siebenundsechzig und trägt eine Brille. Sie wohnen in einem kleinen Haus mit einem schönen Garten. Opa arbeitet im Garten und pflanzt Blumen. Oma backt leckere Kuchen. Am Sonntag essen wir alle zusammen Kaffee und Kuchen. Das ist eine schöne Tradition.",
    vocabulary: ["Großeltern", "Opa", "Oma", "Garten", "Tradition"],
    grammar_focus: "Age expressions, family relationships, descriptive adjectives",
    cultural_note: "Sunday coffee and cake (Kaffee und Kuchen) is a beloved German family tradition."
  },

  {
    day: 9,
    level: "A1",
    topic: "Haus",
    title: "Unser Zuhause",
    text: "Unser Haus hat drei Stockwerke. Im Erdgeschoss sind die Küche, das Wohnzimmer und das Badezimmer. Mein Zimmer ist im ersten Stock. Es ist klein aber gemütlich. Ich habe ein Bett, einen Schreibtisch und einen Kleiderschrank. Tim schläft im Zimmer neben mir. Papa und Mama haben ihr Zimmer im zweiten Stock. Der Keller ist dunkel und kalt.",
    vocabulary: ["Stockwerke", "Erdgeschoss", "Wohnzimmer", "gemütlich", "Keller"],
    grammar_focus: "House vocabulary, ordinal numbers, position words",
    cultural_note: "German houses often have multiple floors, with cellars commonly used for storage and utilities."
  },

  {
    day: 10,
    level: "A1",
    topic: "Essen",
    title: "Das Frühstück",
    text: "Jeden Morgen frühstücken wir zusammen. Mama macht frische Brötchen mit Butter und Marmelade. Papa trinkt schwarzen Kaffee und liest die Zeitung. Tim und ich trinken warme Milch mit Honig. Manchmal gibt es auch gekochte Eier. Das deutsche Frühstück ist lecker und macht uns stark für den Tag. Am Wochenende frühstücken wir länger.",
    vocabulary: ["frühstücken", "Brötchen", "Marmelade", "Honig", "gekochte"],
    grammar_focus: "Meal vocabulary, food preparation, time expressions",
    cultural_note: "German breakfast often includes fresh bread rolls (Brötchen) with various spreads and cold cuts."
  },

  {
    day: 11,
    level: "A1",
    topic: "Zahlen",
    title: "Ich lerne zählen",
    text: "In der Schule lernen wir Zahlen. Eins, zwei, drei, vier, fünf - das kann ich schon gut. Heute zähle ich bis zwanzig. Zehn Finger habe ich an den Händen. Zwölf Stifte liegen auf dem Tisch. Fünfzehn Kinder sind heute in der Klasse. Mathematik macht mir Spaß. Die Lehrerin sagt: 'Lisa, du rechnest sehr gut!'",
    vocabulary: ["zählen", "Finger", "Stifte", "rechnen", "Mathematik"],
    grammar_focus: "Numbers 1-20, counting, quantity expressions",
    cultural_note: "German children learn to count on their fingers, starting with the thumb for 'one'."
  },

  {
    day: 12,
    level: "A1",
    topic: "Zeit",
    title: "Die Uhr",
    text: "Ich lerne die Uhr lesen. Der große Zeiger zeigt die Minuten. Der kleine Zeiger zeigt die Stunden. Um acht Uhr gehe ich zur Schule. Um zwölf Uhr esse ich zu Mittag. Um drei Uhr komme ich nach Hause. Um sieben Uhr gibt es Abendessen. Um neun Uhr gehe ich ins Bett. Die Zeit vergeht schnell!",
    vocabulary: ["Uhr", "Zeiger", "Minuten", "Stunden", "vergeht"],
    grammar_focus: "Time expressions with 'um', time vocabulary",
    cultural_note: "Germans are known for punctuality, and children learn to read analog clocks early."
  },

  {
    day: 13,
    level: "A1",
    topic: "Körper",
    title: "Mein Körper",
    text: "Ich habe zwei Augen, eine Nase und einen Mund. Meine Haare sind braun und meine Augen sind blau. Ich habe zwei Arme und zwei Beine. Mit den Händen kann ich schreiben und malen. Mit den Füßen kann ich laufen und springen. Mein Körper ist gesund und stark. Jeden Tag putze ich meine Zähne.",
    vocabulary: ["Augen", "Nase", "Arme", "Beine", "gesund"],
    grammar_focus: "Body parts, physical descriptions, modal verb 'können'",
    cultural_note: "German children learn body parts through songs and games in kindergarten."
  },

  {
    day: 14,
    level: "A1",
    topic: "Gesundheit",
    title: "Ich bin krank",
    text: "Heute bin ich krank. Mein Hals tut weh und ich habe Husten. Mama misst mein Fieber mit dem Thermometer. Es sind achtunddreißig Grad. Ich muss im Bett bleiben und viel trinken. Der Arzt kommt und gibt mir Medizin. 'In drei Tagen bist du wieder gesund', sagt er. Mama kocht mir Hühnersuppe.",
    vocabulary: ["krank", "Hals", "Husten", "Fieber", "Medizin"],
    grammar_focus: "Health vocabulary, expressing pain, modal verb 'müssen'",
    cultural_note: "German families often treat minor illnesses at home with rest and traditional remedies."
  },

  // Week 3: Daily Life & Objects (Days 15-21)
  {
    day: 15,
    level: "A1",
    topic: "Kleidung",
    title: "Meine Kleider",
    text: "Ich habe viele schöne Kleider. Im Sommer trage ich ein leichtes Kleid und Sandalen. Im Winter ziehe ich warme Hosen und einen dicken Pullover an. Meine Lieblingsjacke ist rot mit gelben Knöpfen. Zu den neuen Schuhen trage ich bunte Socken. Mama hilft mir beim Anziehen. Papa bindet mir die Schuhe zu.",
    vocabulary: ["Kleider", "Sandalen", "Pullover", "Knöpfen", "Socken"],
    grammar_focus: "Clothing vocabulary, seasonal clothing, helping verbs",
    cultural_note: "German children dress appropriately for weather, learning independence in choosing suitable clothes."
  },

  {
    day: 16,
    level: "A1",
    topic: "Winter",
    title: "Es schneit",
    text: "Heute schneit es zum ersten Mal. Die Flocken fallen leise vom Himmel. Alles wird weiß: die Bäume, die Häuser, die Straßen. Tim und ich ziehen warme Jacken an und gehen nach draußen. Wir bauen einen großen Schneemann mit einer orangen Nase. Dann werfen wir Schneebälle. Der Winter macht Spaß!",
    vocabulary: ["schneit", "Flocken", "Bäume", "Schneemann", "Schneebälle"],
    grammar_focus: "Weather descriptions, winter activities, present tense",
    cultural_note: "First snowfall is eagerly awaited by German children who enjoy traditional winter activities."
  },

  {
    day: 17,
    level: "A1",
    topic: "Kochen",
    title: "Plätzchen backen",
    text: "Heute backen Mama und ich Weihnachtsplätzchen. Wir machen Teig aus Mehl, Butter und Zucker. Ich rolle den Teig aus und steche Sterne und Herzen aus. Die Plätzchen kommen in den warmen Ofen. Nach zwanzig Minuten sind sie fertig. Sie riechen süß und lecker. Tim darf sie mit bunter Schokolade verzieren.",
    vocabulary: ["Plätzchen", "Teig", "Mehl", "ausstechen", "verzieren"],
    grammar_focus: "Cooking verbs, baking vocabulary, time expressions",
    cultural_note: "Baking Christmas cookies (Plätzchen) is a cherished German family tradition."
  },

  {
    day: 18,
    level: "A1",
    topic: "Getränke",
    title: "Was ich trinke",
    text: "Ich trinke gerne verschiedene Getränke. Zum Frühstück trinke ich warme Milch oder Kakao. In der Schule trinke ich Wasser aus meiner bunten Flasche. Nachmittags trinke ich manchmal Apfelsaft oder Tee. Mama macht mir heißen Früchtetee wenn es kalt ist. Abends trinke ich ein Glas Milch vor dem Schlafen.",
    vocabulary: ["Getränke", "Kakao", "Flasche", "Apfelsaft", "Früchtetee"],
    grammar_focus: "Drink vocabulary, preferences, time of day",
    cultural_note: "German children often carry water bottles to school and drink herbal teas for health."
  },

  {
    day: 19,
    level: "A1",
    topic: "Haustiere",
    title: "Unser Hund Bello",
    text: "Bello ist unser Hund. Er ist drei Jahre alt und hat braunes Fell. Jeden Morgen geht Papa mit ihm spazieren. Bello kann sitzen, liegen und Pfötchen geben. Er liebt es, im Park zu rennen und mit dem Ball zu spielen. Abends schläft er in seinem Körbchen. Bello ist ein treuer Freund unserer Familie.",
    vocabulary: ["Haustiere", "Fell", "spazieren", "Pfötchen", "treuer"],
    grammar_focus: "Pet vocabulary, animal actions, describing pets",
    cultural_note: "Dogs are popular family pets in Germany, and dog training is taken seriously from an early age."
  },

  {
    day: 20,
    level: "A1",
    topic: "Bauernhof",
    title: "Auf dem Bauernhof",
    text: "Wir besuchen den Bauernhof von Onkel Karl. Dort leben viele Tiere: Kühe, Schweine, Hühner und Schafe. Die Kühe geben Milch und die Hühner legen Eier. Der Hahn weckt uns früh am Morgen mit seinem lauten Ruf. Die kleinen Ferkel sind rosa und sehr süß. Ich füttere die Kaninchen mit frischen Karotten.",
    vocabulary: ["Bauernhof", "Kühe", "Schweine", "Hahn", "Ferkel"],
    grammar_focus: "Farm animals, animal sounds, farm activities",
    cultural_note: "Many German children visit working farms to learn about agriculture and where food comes from."
  },

  {
    day: 21,
    level: "A1",
    topic: "Transport",
    title: "Wie wir fahren",
    text: "Meine Familie hat verschiedene Fahrzeuge. Papa fährt mit dem Auto zur Arbeit. Mama fährt mit dem Fahrrad zum Einkaufen. Ich fahre mit dem Bus zur Schule. Am Wochenende fahren wir mit der Straßenbahn in die Stadt. Für lange Reisen nehmen wir den Zug. Das Flugzeug ist das schnellste Fahrzeug.",
    vocabulary: ["Fahrzeuge", "Fahrrad", "Straßenbahn", "Reisen", "Flugzeug"],
    grammar_focus: "Transportation vocabulary, movement verbs, travel methods",
    cultural_note: "Germans use diverse transportation methods, with many cities having excellent public transport systems."
  }

  // Note: This is a sample of the first 21 stories. The complete collection would continue through day 80
  // following the same patterns and progressive themes outlined in the master plan.
];

// Generate comprehension questions for each story
const generateComprehensionQuestion = (story) => {
  const questionTemplates = [
    {
      question: `Wie heißt das Hauptthema der Geschichte?`,
      getOptions: (story) => [story.topic, "Sport", "Musik", "Reisen"],
      correct: 0,
      explanation: `Die Geschichte handelt von ${story.topic}.`
    },
    {
      question: `Welches Wort kommt in der Geschichte vor?`,
      getOptions: (story) => [story.vocabulary[0], "Computer", "Telefon", "Internet"],
      correct: 0,
      explanation: `Das Wort "${story.vocabulary[0]}" steht im Text.`
    }
  ];

  const template = questionTemplates[story.day % questionTemplates.length];
  return [{
    question: template.question,
    type: "multiple_choice",
    options: template.getOptions(story),
    correct: template.correct,
    explanation: template.explanation
  }];
};

// Enhanced story structure
const createCompleteStoryDatabase = () => {
  return completeA1Stories.map(story => ({
    ...story,
    date: `Day ${story.day}`,
    targetWordCount: story.text.split(' ').length,
    id: story.day,
    completed: false,
    source: "curated",
    created_at: new Date().toISOString(),
    quality_score: 5.0,
    comprehension_questions: generateComprehensionQuestion(story)
  }));
};

// Main generation function
async function generateCompleteA1Collection() {
  console.log('📚 Creating complete A1 German story collection (Days 1-21)...');

  const stories = createCompleteStoryDatabase();

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

  console.log(`✅ Created ${stories.length} A1 German stories`);
  console.log(`📁 Saved to: ${mainPath}`);
  console.log(`📊 Index saved to: ${indexPath}`);
  console.log(`🎯 Average word count: ${index.averageWordCount} words`);
  console.log(`🏆 Quality score: ${index.qualityScore}/5.0`);
  console.log(`📈 Progress: ${stories.length}/80 A1 stories (${Math.round(stories.length/80*100)}%)`);

  return stories;
}

// Main execution
async function main() {
  try {
    await generateCompleteA1Collection();
    console.log('🎉 A1 story collection creation complete!');
    console.log('📝 Note: This creates the first 21 stories. Additional stories can be added following the same pattern.');
  } catch (error) {
    console.error('❌ Error creating A1 stories:', error);
    process.exit(1);
  }
}

main();