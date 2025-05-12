import type { Solution, SolutionSection, SolutionSubmission } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// In-memory store for solutions
let solutions: Solution[] = [
  {
    id: 'two-sets-example',
    title: 'Understanding the Two Sets Problem',
    problemId: 'CSES Two Sets',
    problemStatementLink: 'https://cses.fi/problemset/task/1092',
    author: 'CSES Solver Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: 'Dynamic Programming',
    tags: ['combinatorics', 'number theory', 'greedy'],
    sections: [
      { id: uuidv4(), type: 'heading', content: 'Problem Overview' },
      { id: uuidv4(), type: 'paragraph', content: 'The CSES Two Sets problem asks us to divide numbers from 1 to N into two sets with equal sums. This is a classic combinatorial problem that can be approached in a few ways.' },
      { id: uuidv4(), type: 'heading', content: 'Core Logic' },
      { id: uuidv4(), type: 'paragraph', content: 'First, calculate the total sum S = N * (N + 1) / 2. If S is odd, it\'s impossible to divide the numbers into two sets with equal sums, so print "NO".' },
      { id: uuidv4(), type: 'code', content: 'long long total_sum = n * (n + 1) / 2;\nif (total_sum % 2 != 0) {\n  cout << "NO" << endl;\n  return 0;\n}', language: 'cpp' },
      { id: uuidv4(), type: 'paragraph', content: 'If S is even, the target sum for each set is S / 2. We can greedily pick numbers from N down to 1 for the first set. If adding the current number doesn\'t exceed S / 2, add it. Otherwise, skip it.' },
      { id: uuidv4(), type: 'equation', content: 'S_target = S / 2' },
      { id: uuidv4(), type: 'hint', content: 'Consider the properties of arithmetic series. The sum of the first N natural numbers is N*(N+1)/2.' },
    ],
    isApproved: true,
  },
  {
    id: 'missing-number-example',
    title: 'Finding the Missing Number Efficiently',
    problemId: 'CSES Missing Number',
    problemStatementLink: 'https://cses.fi/problemset/task/1083',
    author: 'CSES Solver Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: 'Implementation',
    tags: ['arrays', 'math', 'xor'],
    sections: [
      { id: uuidv4(), type: 'heading', content: 'Problem Statement' },
      { id: uuidv4(), type: 'paragraph', content: 'Given N-1 numbers from 1 to N, find the missing number. This is a common interview question as well.' },
      { id: uuidv4(), type: 'heading', content: 'Solution with Summation' },
      { id: uuidv4(), type: 'paragraph', content: 'Calculate the expected sum of numbers from 1 to N: S_expected = N * (N + 1) / 2. Then, sum the given N-1 numbers: S_actual. The missing number is S_expected - S_actual.' },
      { id: uuidv4(), type: 'code', content: 'long long n;\ncin >> n;\nlong long expected_sum = n * (n + 1) / 2;\nlong long actual_sum = 0;\nfor (int i = 0; i < n - 1; ++i) {\n  long long x;\n  cin >> x;\n  actual_sum += x;\n}\ncout << expected_sum - actual_sum << endl;', language: 'cpp' },
      { id: uuidv4(), type: 'hint', content: 'What if N is very large? Could there be overflow issues with sum? Consider XOR property.'}
    ],
    isApproved: true,
  }
];

export async function getSolutions(): Promise<Solution[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return solutions.filter(solution => solution.isApproved);
}

export async function getAllSolutionsForAdmin(): Promise<Solution[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return solutions; // Return all solutions for admin
}

export async function getSolutionById(id: string): Promise<Solution | undefined> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const solution = solutions.find(solution => solution.id === id);
  // Public users should only see approved solutions by ID, unless an admin is fetching.
  // For simplicity here, we allow fetching any by ID, but pages should enforce.
  // If page components use `getSolutions` for lists and `getSolutionById` for details,
  // the detail page should also check `isApproved` if it's for public view.
  return solution;
}

export async function addSolution(data: SolutionSubmission): Promise<Solution> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const now = new Date().toISOString();
  const newSolution: Solution = {
    id: data.title.toLowerCase().replace(/\s+/g, '-') + '-' + uuidv4().slice(0,4), // simple slug
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
      id: uuidv4(), 
      language: section.type === 'code' ? section.language : undefined 
    })),
    isApproved: false, // New solutions are not approved by default
  };
  solutions.unshift(newSolution); 

  revalidatePath('/');
  revalidatePath('/admin'); // Revalidate admin page
  revalidatePath(`/problems/${newSolution.id}`);
  if (solutions.length > 100) { 
    solutions.pop();
  }
  return newSolution;
}

export async function updateSolution(id: string, updatedSections: SolutionSection[]): Promise<Solution | undefined> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const solutionIndex = solutions.findIndex(s => s.id === id);
  if (solutionIndex === -1) {
    return undefined;
  }
  solutions[solutionIndex].sections = updatedSections.map(section => ({
    ...section,
    language: section.type === 'code' ? section.language : undefined
  }));
  solutions[solutionIndex].updatedAt = new Date().toISOString();
  
  revalidatePath(`/problems/${id}`);
  revalidatePath('/admin');
  return solutions[solutionIndex];
}

export async function toggleSolutionApproval(id: string): Promise<Solution | undefined> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const solutionIndex = solutions.findIndex(s => s.id === id);
  if (solutionIndex === -1) {
    return undefined;
  }
  solutions[solutionIndex].isApproved = !solutions[solutionIndex].isApproved;
  solutions[solutionIndex].updatedAt = new Date().toISOString();

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/problems/${id}`);
  return solutions[solutionIndex];
}
