import type { Solution, SolutionSection, SolutionSubmission } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db'; // Import the database connection function
import { Collection } from 'mongodb';

// Get the MongoDB collection for solutions
async function getSolutionsCollection(): Promise<Collection<Solution>> {
  const db = await connectToDatabase();
  return db.collection<Solution>('solutions');
}

export async function getSolutions(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  const solutions = await collection.find({ isApproved: true }).toArray();
  return solutions as Solution[]; // Cast to Solution[]
}

export async function getAllSolutionsForAdmin(): Promise<Solution[]> {
  const collection = await getSolutionsCollection();
  const solutions = await collection.find({}).toArray();
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

  // Generate a simple slug, ensuring uniqueness might require a loop or more robust method
  const baseSlug = data.title.toLowerCase().replace(/\s+/g, '-');
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
    sections: data.sections.map(section => ({
      ...section,
      // MongoDB will generate _id for sections, we don't need client-side UUIDs here
      language: section.type === 'code' ? section.language : undefined
    }) as SolutionSection), // Cast to SolutionSection
    isApproved: false, // New solutions are not approved by default
  };

  await collection.insertOne(newSolution);

  revalidatePath('/');
  revalidatePath('/admin'); // Revalidate admin page
  revalidatePath(`/problems/${newSolution.id}`);
  if (solutions.length > 100) { 
    solutions.pop();
  }
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
          ...section,
          language: section.type === 'code' ? section.language : undefined
        }) as SolutionSection), // Cast to SolutionSection
        updatedAt: now,
      },
    },
    { returnDocument: 'after' } // Return the updated document
  );

  revalidatePath(`/problems/${id}`);
  revalidatePath('/admin');
  return result.value as Solution | undefined; // Cast to Solution | undefined
}

export async function toggleSolutionApproval(id: string): Promise<Solution | undefined> {
  const collection = await getSolutionsCollection();
  const now = new Date().toISOString();

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/problems/${id}`);

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
