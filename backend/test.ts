// Simple test file to verify TypeScript configuration
console.log("TypeScript configuration test");

// Define a simple interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Create a function that uses the interface
function createUser(name: string, email: string): User {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    email
  };
}

// Use the function
const user = createUser("Test User", "test@example.com");
console.log("Created user:", user);

// Export something to verify module system
export const testCompleted = true;