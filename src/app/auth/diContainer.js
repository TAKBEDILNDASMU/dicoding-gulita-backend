import AuthHandler from './handler.js';
import AuthService from './service.js';
import UserRepository from './repository.js';

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authHandler = new AuthHandler(authService);

export { authHandler };
