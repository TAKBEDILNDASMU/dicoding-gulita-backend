import UserHandler from './handler.js';
import UserService from './service.js';
import UserRepository from './repository.js';

const userRepository = new UserRepository();
const authService = new UserService(userRepository);
const authHandler = new UserHandler(authService);

export { authHandler };
