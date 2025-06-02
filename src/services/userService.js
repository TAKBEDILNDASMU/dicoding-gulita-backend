'use strict';

import { hashPassword } from '../lib/passwordUtils.js';

// In-memory store for simplicity. Replace with database interactions.
const users = [];

export const createUser = async ({ username, email, password }) => {
  // Check if user already exists
  const existingUser = users.find((user) => user.username === username || user.email === email);
  if (existingUser) {
    const error = new Error('Username or email already exists');
    error.statusCode = 409; // Conflict
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const newUser = {
    id: users.length + 1, // Simple ID, replace with DB-generated ID
    username,
    email,
    password: hashedPassword, // Store the hashed password
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  console.log(
    'Current users in memory:',
    users.map((u) => ({ id: u.id, username: u.username })),
  ); // For debugging

  // Return user data, excluding the password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// You could add more functions here:
// export const findUserByEmail = async (email) => { ... };
// export const findUserById = async (id) => { ... };
