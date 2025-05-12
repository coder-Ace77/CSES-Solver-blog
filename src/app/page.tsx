
import { getSolutions } from '@/lib/db';
import type { Solution } from '@/lib/types';
import SolutionListClient from '@/components/SolutionListClient'; // Import the new client component

export default async function ProblemListPage() {
  // Fetch solutions on the server
  let initialSolutions: Solution[] = [];
  let fetchError = null;
  try {
    initialSolutions = await getSolutions(); // Fetches approved solutions
  } catch (error) {
    console.error("Failed to fetch solutions on server:", error);
    fetchError = "Failed to load solutions. Please try again later.";
    // Handle error appropriately, maybe show an error message to the user
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          CSES Problem Solutions
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground sm:mt-6">
          Explore expertly crafted solutions for CSES problems. Enhance your understanding and coding skills.
        </p>
      </div>

      {/* Pass fetched solutions to the client component */}
      <SolutionListClient initialSolutions={initialSolutions} fetchError={fetchError} />
    </div>
  );
}
