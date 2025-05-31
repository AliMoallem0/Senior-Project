import { toast } from "@/components/ui/use-toast";
import { createUser, findUserByEmail, updateUserLastLogin } from './dbService';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Simple in-memory user storage
const users = new Map<string, any>();

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export const signup = async (userData: { email: string; password: string; name: string }) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password
    const hashedPassword = await hash(userData.password, 10);

    // Create new user with hashed password and default role
    const newUser = await createUser({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: 'user' // Set default role
    });

    // Return user data without sensitive information
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    };
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof Error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
    throw new Error('Signup failed: An unexpected error occurred');
  }
};

export const login = async (email: string, password: string) => {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user ID exists and is valid
    if (typeof user.id === 'undefined') {
      throw new Error('Invalid user data: missing ID');
    }

    // Update last login time
    await updateUserLastLogin(user.id);

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Return user data and token without sensitive information
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      throw new Error(`Login failed: ${error.message}`);
    }
    throw new Error('Login failed: An unexpected error occurred');
  }
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

export const testSignupAndDatabase = async () => {
  try {
    // Test user data
    const testUser = {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User'
    };

    // First, try to sign up the test user
    const signupResult = await signup(testUser);
    console.log('Signup Result:', signupResult);

    // Then, try to find the user by making an API call
    const response = await fetch(`${API_BASE_URL}/users/email/${testUser.email}`);
    const user = await response.json();
    
    if (user) {
      console.log('User found:', {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      });
      return true;
    } else {
      console.error('User not found');
      return false;
    }
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}; 