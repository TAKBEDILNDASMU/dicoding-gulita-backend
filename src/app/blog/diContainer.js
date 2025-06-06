import BlogHandler from './handler.js';
import BlogService from './service.js';
import BlogRepository from './repository.js';

const blogRepository = new BlogRepository();
const blogService = new BlogService(blogRepository);
const blogHandler = new BlogHandler(blogService);

export { blogHandler };
