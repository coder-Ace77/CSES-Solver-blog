import type { Solution, SolutionSection, SolutionSubmission } from '@/lib/types';
// Removed: import { connectToDatabase } from '@/lib/db'; // This was causing the duplicate definition error
import { Collection } from 'mongodb';
import { MongoClient, Db } from 'mongodb'; // Moved MongoClient and Db import to the top for clarity

// Get the MongoDB collection for solutions
async function getSolutionsCollection(): Promise<Collection<Solution>> {
  const db = await connectToDatabase();
  return db.collection<Solution>('solutions');
}

export async function getSolutions(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  // Fetch only approved solutions for the public list
  const solutions = await collection.find({ isApproved: true }).sort({ createdAt: -1 }).toArray();
  return solutions as Solution[]; // Cast to Solution[]
}

export async function getAllSolutionsForAdmin(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  // Fetch all solutions for the admin dashboard, regardless of approval status
  const solutions = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return solutions as Solution[]; // Return all solutions for admin, cast to Solution[]
}

export async function getSolutionById(id: string): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const solution = await collection.findOne({ id });
  return solution as Solution | undefined; // Cast to Solution | undefined
}

export async function addSolution(data: SolutionSubmission): Promise<Solution> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  // Generate a simple slug (id) from the title
  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let id = baseSlug;
  let counter = 1;
  // Ensure ID uniqueness
  while (await collection.findOne({ id })) {
    id = `${baseSlug}-${counter}`;
    counter++;
  }

  const newSolution: Solution = {
    id: id, // Use the generated unique ID
    title: data.title,
    problemId: data.problemId,
    problemStatementLink: data.problemStatementLink,
    author: 'CSES Solver Team', // Consider making this dynamic if users can submit
    createdAt: now,
    updatedAt: now,
    category: data.category,
    tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    sections: data.sections.map((section, index) => ({
      id: `${id}-section-${index + 1}`, // Assign a unique ID to each section
      type: section.type,
      content: section.content,
      language: section.type === 'code' ? section.language || 'plaintext' : undefined,
    })),
    isApproved: false, // New solutions require approval
  };

  await collection.insertOne(newSolution);

  return newSolution;
}

export async function updateSolution(id: string, updatedSections: SolutionSection[]): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  const result = await collection.findOneAndUpdate(
    { id },
    {
      $set: {
        sections: updatedSections.map(section => ({ // Ensure section ID is preserved
          id: section.id,
          type: section.type,
          content: section.content,
          language: section.type === 'code' ? section.language : undefined
        })),
        updatedAt: now,
      },
    },
    { returnDocument: 'after' } // Return the updated document
  );

  return result.value as Solution | undefined; // Cast to Solution | undefined
}


export async function toggleSolutionApproval(id: string): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  const solution = await collection.findOne({ id });
  if (!solution) {
    return undefined;
  }

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { isApproved: !solution.isApproved, updatedAt: now } },
    { returnDocument: 'after' }
  );

  return result.value as Solution | undefined; // Cast to Solution | undefined
}

// Ensure connectToDatabase exists and is correctly implemented/imported elsewhere
// Assuming connectToDatabase handles MongoDB connection and returns the Db instance

const MONGODB_URI = process.env.MONGODB_URI; // Read from .env
const DB_NAME = process.env.DB_NAME; // Read from .env

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }
    if (!DB_NAME) {
    throw new Error('Please define the DB_NAME environment variable inside .env');
  }

  const client = await MongoClient.connect(MONGODB_URI);

  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}
