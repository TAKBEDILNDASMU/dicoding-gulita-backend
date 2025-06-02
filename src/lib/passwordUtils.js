'use strict';

import Bcrypt from 'bcryptjs';
import config from '../config/index.js';

export const hashPassword = async (password) => {
  return Bcrypt.hash(password, config.bcrypt.saltRounds);
};

// You might add a comparePassword function here later for login
// export const comparePassword = async (password, hashedPassword) => {
//   return Bcrypt.compare(password, hashedPassword);
// };
