
import type { Solution, SolutionSection, SolutionSubmission, SolutionSectionType } from '@/lib/types';
import { Collection } from 'mongodb';
import { MongoClient, Db } from 'mongodb'; 

// Helper function to convert MongoDB doc to plain Solution object
// that can be passed from Server to Client Components.
function mongoDocToPlainSolution(doc: any): Solution {
  if (!doc) {
    // If the document is null or undefined (e.g., findOne returning null),
    // return it as is. The calling function will handle it.
    return doc;
  }

  const { _id, ...restOfDoc } = doc; // Key step: remove the BSON ObjectId

  // Reconstruct the object to ensure it matches the Solution type
  // and all nested structures are also plain.
  return {
    id: restOfDoc.id as string,
    title: restOfDoc.title as string,
    problemId: restOfDoc.problemId as string,
    problemStatementLink: restOfDoc.problemStatementLink as string | undefined,
    author: restOfDoc.author as string,
    createdAt: restOfDoc.createdAt as string, // Already stored as ISO string
    updatedAt: restOfDoc.updatedAt as string, // Already stored as ISO string
    category: restOfDoc.category as string,
    tags: restOfDoc.tags as string[], // Already stored as array of strings
    sections: (restOfDoc.sections as any[]).map(section => ({
      id: section.id as string,
      type: section.type as SolutionSectionType,
      content: section.content as string,
      language: section.language as string | undefined,
    })),
    isApproved: restOfDoc.isApproved as boolean,
  };
}

// Get the MongoDB collection for solutions
async function getSolutionsCollection(): Promise<Collection<Solution>> {
  const db = await connectToDatabase();
  return db.collection<Solution>('solutions');
}

export async function getSolutions(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  const solutionsFromDb = await collection.find({ isApproved: true }).sort({ createdAt: -1 }).toArray();
  return solutionsFromDb.map(mongoDocToPlainSolution);
}

export async function getAllSolutionsForAdmin(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  const solutionsFromDb = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return solutionsFromDb.map(mongoDocToPlainSolution);
}

export async function getSolutionById(id: string): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const solutionFromDb = await collection.findOne({ id });
  return solutionFromDb ? mongoDocToPlainSolution(solutionFromDb) : undefined;
}

export async function addSolution(data: SolutionSubmission): Promise<Solution> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let id = baseSlug;
  let counter = 1;
  while (await collection.findOne({ id })) {
    id = `${baseSlug}-${counter}`;
    counter++;
  }

  const newSolution: Solution = {
    id: id,
    title: data.title,
    problemId: data.problemId,
    problemStatementLink: data.problemStatementLink,
    author: 'CSES Solver Team',
    createdAt: now,
    updatedAt: now,
    category: data.category,
    tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    sections: data.sections.map((section, index) => ({
      id: `${id}-section-${index + 1}`,
      type: section.type,
      content: section.content,
      language: section.type === 'code' ? section.language || 'plaintext' : undefined,
    })),
    isApproved: false,
  };

  await collection.insertOne(newSolution as any); // newSolution is already plain. MongoDB adds _id in DB.
  // Return the plain newSolution object, which doesn't have the complex _id from DB yet.
  return newSolution; 
}

export async function updateSolution(id: string, updatedSections: SolutionSection[]): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  const result = await collection.findOneAndUpdate(
    { id },
    {
      $set: {
        sections: updatedSections.map(section => ({ 
          id: section.id,
          type: section.type,
          content: section.content,
          language: section.type === 'code' ? section.language : undefined
        })),
        updatedAt: now,
      },
    },
    { returnDocument: 'after' } 
  );
  
  return result.value ? mongoDocToPlainSolution(result.value) : undefined;
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

  return result.value ? mongoDocToPlainSolution(result.value) : undefined;
}


const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

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

  // Ensure the MONGODB_URI includes the appName for newer MongoDB versions if needed
  // Example: mongodb+srv://<username>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority&appName=YourAppName
  // Or ensure your connection string from Atlas is correctly pasted.
  
  // For TLS/SSL issues, especially with specific Node.js versions or environments,
  // you might need to configure TLS options. However, start with the simplest connection.
  // If 'tlsv1 alert internal error' persists, it could be network, firewall, Node version, or MongoDB Atlas IP whitelist.
  const client = await MongoClient.connect(MONGODB_URI, {
    // tls: true, // Explicitly enable TLS; often default for srv strings
    // tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production', // For local dev if needed, NOT for prod
  });

  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}
