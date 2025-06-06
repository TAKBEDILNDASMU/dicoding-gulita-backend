import CheckHandler from './handler.js';
import CheckService from './service.js';
import CheckRepository from './repository.js';

const checkRepository = new CheckRepository();
const checkService = new CheckService(checkRepository);
const checkHandler = new CheckHandler(checkService);

export { checkHandler };
